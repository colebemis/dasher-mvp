import Head from 'next/head'
import { withRouter } from 'next/router'
import { arrayOf, shape, string } from 'prop-types'
import { stringify } from 'querystring'
import React, { Component } from 'react'
import columns from '../src/columns'
import Box from '../components/Box'
import ButtonOutline from '../components/ButtonOutline'
import Column from '../components/Column'
import Flex from '../components/Flex'
import Heading from '../components/Heading'
import HorizontalScroll from '../components/HorizontalScroll'
import QueryForm from '../components/QueryForm'
import { GITHUB_TOKEN_KEY, loggedIn, logOut } from '../lib/auth'
import { searchPullRequests } from '../lib/github'
import { cookies, join, redirect } from '../lib/utils'
import Text from '../components/Text'

class IndexPage extends Component {
  static propTypes = {
    router: shape({
      query: shape({
        from: string,
      }).isRequired,
    }).isRequired,
    columns: arrayOf(
      shape({
        githubQuery: string.isRequired,
      }),
    ).isRequired,
  }

  static async getInitialProps({ req, res, asPath, query }) {
    if (!loggedIn(req)) {
      redirect(`/login?${stringify({ from: asPath })}`, res)
    }

    const githubToken = cookies(req)[GITHUB_TOKEN_KEY]

    const columnsWithData = await Promise.all(
      columns.map(async column => {
        const githubQuery = join(column.githubQuery, query.query, 'state:open')
        const { data } = await searchPullRequests({ githubQuery, githubToken })

        if (data.errors) {
          throw new Error(JSON.stringify(data.errors))
        }

        return { ...column, githubQuery, data: data.data.search }
      }),
    )

    return { columns: columnsWithData }
  }

  render() {
    const { router, columns } = this.props

    return (
      <Flex flexDirection="column" height="100vh">
        <Head>
          <title>
            {router.query.query
              ? `${router.query.query} | PullBoard`
              : 'PullBoard'}
          </title>
        </Head>
        <Flex alignItems="center" flexWrap="wrap" flex="0 0 auto" pt={4} px={4}>
          <Box flex={['1 1 auto', '0 1 auto']}>
            <Heading is="h1" fontSize={4}>
              PullBoard{' '}
              <Text color="gray.7" fontWeight="light">
                Alpha
              </Text>
            </Heading>
          </Box>
          <Box
            mx={[0, 4]}
            mt={[4, 0]}
            width={[1, 'auto']}
            flex="1 1 auto"
            order={[1, 0]}
          >
            <QueryForm />
          </Box>
          <ButtonOutline
            alignSelf="stretch"
            onClick={() => {
              logOut()
              redirect('/login')
            }}
          >
            Log out
          </ButtonOutline>
        </Flex>
        <HorizontalScroll flex="1 1 auto">
          <Flex px={2} py={4}>
            {columns.map(column => (
              <Column key={column.githubQuery} column={column} />
            ))}
          </Flex>
        </HorizontalScroll>
      </Flex>
    )
  }
}

export default withRouter(IndexPage)
