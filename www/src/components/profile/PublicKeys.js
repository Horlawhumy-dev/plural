import { useMutation, useQuery } from '@apollo/client'
import { Box } from 'grommet'
import { Span } from 'honorable'
import moment from 'moment'
import { useState } from 'react'

import { extendConnection } from '../../utils/graphql'
import { Confirm } from '../account/Confirm'
import { Placeholder } from '../accounts/Audits'

import { DELETE_KEY, LIST_KEYS } from '../users/queries'
import { LoopingLogo } from '../utils/AnimatedLogo'
import { Container } from '../utils/Container'
import { StandardScroller } from '../utils/SmoothScroller'

import { Header } from './Header'
import { DeleteIcon } from './Icon'
import { ListItem } from './ListItem'

function PublicKey({ pubkey: key, first, last }) {
  const [confirm, setConfirm] = useState(false)
  const [mutation, { loading, error }] = useMutation(DELETE_KEY, {
    variables: { id: key.id },
    refetchQueries: [{ query: LIST_KEYS }],
    onCompleted: () => setConfirm(false),
  })

  return (
    <>
      <ListItem
        first={first}
        last={last}
      >
        <Box
          fill="horizontal"
          gap="xsmall"
        >
          <Box
            direction="row"
            align="center"
            gap="small"
          >
            <Span fontWeight="bold">{key.name}</Span>
            <Span color="text-xlight">added on {moment(key.insertedAt).format('lll')}</Span>
          </Box>
          <Span color="text-light">{key.digest.toLowerCase()}</Span>
        </Box>
        <Box
          flex={false}
          align="center"
          direction="row"
        >
          <DeleteIcon onClick={() => setConfirm(true)} />
        </Box>
      </ListItem>
      <Confirm
        open={confirm}
        title="Delete Public Key"
        text="Are you sure you want to delete this public key?"
        close={() => setConfirm(false)}
        submit={mutation}
        loading={loading}
        destructive
        error={error}
      />
    </>
  )
}

export function PublicKeys() {
  const [listRef, setListRef] = useState(null)
  const { data, loading, fetchMore } = useQuery(LIST_KEYS)

  if (!data) return <LoopingLogo />

  const { edges, pageInfo } = data.publicKeys

  return (
    <Container type="table">
      <Box
        fill
        gap="medium"
      >
        <Header
          header="Public Keys"
          description="Age public keys to use when sharing repository encryption"
        />
        <Box fill>
          <StandardScroller
            listRef={listRef}
            setListRef={setListRef}
            items={edges}
            placeholder={Placeholder}
            mapper={({ node }, { prev, next }) => (
              <PublicKey
                pubkey={node}
                first={!prev.node}
                last={!next.node}
              />
            )}
            loading={loading}
            hasNextPage={pageInfo.hasNextPage}
            loadNextPage={pageInfo.hasNextPage && fetchMore({
              variables: { cursor: pageInfo.endCursor },
              updateQuery: (prev, { fetchMoreResult: { publicKeys } }) => extendConnection(prev, publicKeys, 'publicKeys'),
            })}
          />
        </Box>
      </Box>
    </Container>
  )
}
