import './shell.css'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { XTerm } from 'xterm-for-react'
import { FitAddon } from 'xterm-addon-fit'
import { useQuery } from '@apollo/client'
import { Button, Div, Flex, Span } from 'honorable'

import { ReloadIcon } from 'pluralsh-design-system'

import { LoopingLogo } from '../utils/AnimatedLogo'
import { socket } from '../../helpers/client'

import TerminalThemeContext from '../../contexts/TerminalThemeContext'

import { CLOUD_SHELL_QUERY } from './query'
import TerminalThemeSelector from './TerminalThemeSelector'
import { normalizedThemes } from './themes'
import { ShellStatus } from './onboarding/ShellStatus'
import TerminalThemeProvider from './TerminalThemeProvider'
import TerminalSidebar from './TerminalSidebar'
import TerminalInformation from './TerminalInformation'

const { Buffer } = require('buffer/')

const decodeBase64 = str => Buffer.from(str, 'base64').toString('utf-8')

export function Shell({ shell }) {
  const terminalRef = useRef()
  const xterm = useRef(null)
  const [channel, setChannel] = useState(null)
  const [dimensions, setDimensions] = useState({})
  const [isCheatsheet] = useState(false)
  const fitAddon = useMemo(() => new FitAddon(), [])
  const [terminalTheme] = useContext(TerminalThemeContext)

  useEffect(() => {
    if (!xterm?.current?.terminal) return

    const term = xterm.current.terminal
    const chan = socket.channel('shells:me', {})

    fitAddon.fit()
    term.write(`Booting into your ${shell.provider} shell...\r\n\r\n`)
    chan.onError(console.log)
    chan.on('stdo', ({ message }) => term.write(decodeBase64(message)))
    chan.join()

    const { cols, rows } = fitAddon.proposeDimensions() || { cols: 80, rows: 24 }

    setDimensions({ cols, rows })
    setChannel(chan)

    const ref = socket.onOpen(() => setTimeout(() => chan.push('resize', { width: cols, height: rows }), 1000))

    return () => {
      socket.off([ref])
      chan.leave()
    }
  }, [shell, xterm, fitAddon])

  const handleResetSize = useCallback(() => {
    if (!channel) return
    channel.push('resize', { width: dimensions.cols, height: dimensions.rows })
  }, [channel, dimensions])

  useEffect(() => {
    handleResetSize()
  }, [handleResetSize])

  function handleResize({ cols, rows }) {
    if (!channel) return
    channel.push('resize', { width: cols, height: rows })
  }

  function handleData(text) {
    channel.push('command', { cmd: text })
  }

  console.log(shell)

  return (
    <>
      <Flex
        align="center"
        paddingVertical="small"
        marginHorizontal="medium"
        gap="medium"
        borderBottom="1px solid border"
      >
        {/* <Button
          small
          tertiary
          startIcon={(
            <ScrollIcon />
          )}
          onClick={() => setIsCheatsheet(x => !x)}
        >
          CLI Cheatsheet
        </Button> */}
        <Div><Span fontWeight="bold">{shell.cluster}</Span></Div>
        <Div flexGrow={1} />
        <TerminalInformation shell={shell} />
        <Button
          small
          tertiary
          startIcon={(<ReloadIcon />)}
          onClick={handleResetSize}
        >
          Repair viewport
        </Button>
        <TerminalThemeSelector />
      </Flex>
      <Flex
        marginTop="medium"
        flexGrow={1}
        gap="xlarge"
        paddingBottom="medium"
        paddingHorizontal="medium"
        height="100%"
        maxHeight="100%"
        overflow="hidden"
      >
        <TerminalSidebar
          shell={shell}
          isCheatsheet={isCheatsheet}
        />
        <Flex
          ref={terminalRef}
          align="center"
          justify="center"
          overflow="hidden"
          borderRadius="large"
          border="1px solid border"
          flexGrow={1}
          paddingTop="medium"
          paddingHorizontal="medium"
          backgroundColor={normalizedThemes[terminalTheme].background}
        >
          <XTerm
            className="terminal"
            ref={xterm}
            addons={[fitAddon]}
            options={{ theme: normalizedThemes[terminalTheme] }}
            onResize={handleResize}
            onData={handleData}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </Flex>
      </Flex>
    </>
  )
}

export function Terminal() {
  const { data } = useQuery(CLOUD_SHELL_QUERY, { pollInterval: 5000, fetchPolicy: 'cache-and-network' })

  if (!data || !data.shell) {
    return (
      <LoopingLogo />
    )
  }

  if (!data.shell.alive) {
    return (
      <ShellStatus shell={data.shell} />
    )
  }

  const { shell } = data

  return (
    <TerminalThemeProvider>
      <Shell shell={shell} />
    </TerminalThemeProvider>
  )
}
