import { forwardRef, useContext, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Avatar, Div, Flex, Img, Menu, MenuItem, P, useOutsideClick } from 'honorable'
import {
  ArrowTopRightIcon,
  ClusterIcon,
  DiscordIcon,
  DownloadIcon,
  GitHubLogoIcon,
  HamburgerMenuCollapseIcon,
  HamburgerMenuCollapsedIcon,
  LightningIcon,
  ListIcon,
  LogoutIcon,
  MarketIcon,
  PeopleIcon,
  PersonIcon,
  ScrollIcon, TerminalIcon, Tooltip,
} from 'pluralsh-design-system'

import { getPreviousUserData, setPreviousUserData, setToken, wipeToken } from '../../helpers/authentication'

import { CurrentUserContext } from '../login/CurrentUser'

import WithNotifications from './WithNotifications'
import WithApplicationUpdate from './WithApplicationUpdate'

export const SIDEBAR_ICON_HEIGHT = '40px'
export const SIDEBAR_WIDTH = '224px'
export const SMALL_WIDTH = '60px'

function SidebarWrapper() {
  const me = useContext(CurrentUserContext)
  const { pathname } = useLocation()

  const items = [
    {
      name: 'Marketplace',
      Icon: MarketIcon,
      url: '/marketplace',
      urlRegexp: /^\/(marketplace|installed|repository)/,
    },
    {
      name: 'Cloud Shell',
      Icon: TerminalIcon,
      url: '/shell',
      urlRegexp: /^\/(shell|oauth\/callback\/.+\/shell)/,
    },
    {
      name: 'Account',
      Icon: PeopleIcon,
      url: '/account',
    },
    {
      name: 'Clusters',
      Icon: ClusterIcon,
      url: '/clusters',
    },
    {
      name: 'Audits',
      Icon: ListIcon,
      url: '/audits',
    },
  ]

  return (
    <WithNotifications>
      {({ notificationsCount, toggleNotificationsPanel, isNotificationsPanelOpen }) => (
        <WithApplicationUpdate>
          {({ reloadApplication, shouldReloadApplication }) => (
            <Sidebar
              items={items}
              activeId={isNotificationsPanelOpen ? 'notifications' : pathname}
              notificationsCount={notificationsCount}
              onNotificationsClick={toggleNotificationsPanel}
              hasUpdate={shouldReloadApplication}
              onUpdateClick={reloadApplication}
              userName={me.name}
              userImageUrl={me.avatar}
              userAccount={me.account?.name}
            />
          )}
        </WithApplicationUpdate>
      )}
    </WithNotifications>
  )
}

function TransitionText({ collapsed, ...props }) {
  return (
    <P
      display="block"
      opacity={collapsed ? 0 : 1}
      visibility={collapsed ? 'hidden' : 'visible'}
      transition={`opacity ${collapsed ? 200 : 500}ms ease, background-color ${collapsed ? 200 : 500}ms ease ${collapsed ? 0 : 50}ms, visibility 200ms linear, color 150ms linear`}
      {...props}
    />
  )
}

function SidebarItemRef({
  active,
  highlight,
  collapsed,
  startIcon,
  endIcon,
  label,
  tooltip,
  badge = 0,
  linkTo,
  ...otherProps
},
ref
) {
  const [hovered, setHovered] = useState(false)

  function wrapLink(node) {
    if (!linkTo) return node

    if (linkTo.startsWith('http')) {
      return (
        <a
          href={linkTo}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          {node}
        </a>
      )
    }

    return (
      <Link
        to={linkTo}
        style={{ textDecoration: 'none' }}
      >
        {node}
      </Link>
    )
  }

  function wrapTooltip(node) {
    if (!tooltip) return node

    return (
      <Tooltip
        arrow
        placement="right"
        label={tooltip}
        zIndex={1000}
        visibility={collapsed ? 'visible' : 'hidden'}
        display={hovered ? 'block' : 'none'}
        whiteSpace="nowrap"
      >
        {node}
      </Tooltip>
    )
  }

  return wrapLink(wrapTooltip(
    <Flex
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={ref}
      pt="13px" // Give it a square look with a weird padding
      pb="6px"
      px={0.75}
      align="center"
      borderRadius="normal"
      cursor="pointer"
      {... { '& *': { color: highlight ? 'text-warning-light' : active ? 'text' : 'text-light' } }}
      backgroundColor={active ? 'fill-zero-selected' : null}
      _hover={{
        '& *': { color: highlight ? 'text-warning-light' : 'text' },
        backgroundColor: active ? 'fill-zero-selected' : 'fill-zero-hover',
      }}
      {...otherProps}
    >
      <Flex
        align="center"
        justify="center"
        position="relative"
      >
        <Div {...{ '& *': { transition: 'color 150ms linear' } }}>
          {startIcon}
        </Div>
        {badge > 0 && (
          <Flex
            align="center"
            justify="center"
            position="absolute"
            backgroundColor="icon-error"
            borderRadius="50%"
            fontSize={8}
            width={10}
            height={10}
            top={-6}
            right={-8}
          >
            {badge}
          </Flex>
        )}
      </Flex>
      <Flex
        ml={1}
        mr={endIcon ? -0.25 : 0}
        marginTop="-4px"
        flexShrink={0}
        align="center"
        flexGrow={1}
        opacity={collapsed ? 0 : 1}
        visibility={collapsed ? 'hidden' : 'visible'}
        transition={`opacity ${collapsed ? 200 : 500}ms ease, background-color ${collapsed ? 200 : 500}ms ease ${collapsed ? 0 : 50}ms, visibility 200ms linear, color 150ms linear`}
      >
        {label}
        <Div
          ml={1}
          flexGrow={1}
        />
        {endIcon}
      </Flex>
    </Flex>
  ))
}

const SidebarItem = forwardRef(SidebarItemRef)

function Sidebar({
  activeId = '',
  hasUpdate = false,
  items = [],
  notificationsCount = 0,
  onNotificationsClick = () => {},
  onUpdateClick = () => {},
  userImageUrl,
  userName,
  userAccount,
  ...props
}) {
  const menuItemRef = useRef()
  const menuRef = useRef()
  const [isMenuOpen, setIsMenuOpened] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  const sidebarWidth = collapsed ? 65 : 256 - 32 // 64 + 1px border
  const previousUserData = getPreviousUserData()

  useOutsideClick(menuRef, event => {
    console.log('event.target', event.target)
    console.log('menuItemRef.current', menuItemRef.current)
    if (!menuItemRef.current.contains(event.target)) {
      setIsMenuOpened(false)
    }
  })

  function handlePreviousUserClick() {
    setToken(previousUserData.jwt)
    setPreviousUserData(null)
    window.location.reload()
  }

  function handleLogout() {
    wipeToken()
    window.location = '/'
  }

  return (
    <>
      <Flex
        direction="column"
        flexGrow={0}
        flexShrink={0}
        width={sidebarWidth}
        height="100vh"
        maxHeight="100vh"
        borderRight="1px solid border"
        userSelect="none"
        transition="width 300ms ease"
        position="relative"
        {...props}
      >
        {/* ---
          HEADER
        --- */}
        <Link to="/">
          <Flex
            py={1}
            pl={1.25}
            flexShrink={0}
            align="center"
            borderBottom="1px solid border"
          >
            <Img
              src="/plural-logo-white.svg"
              width={24}
            />
            <TransitionText
              ml={1}
              mb="-4px"
              collapsed={collapsed}
            >
              <Img
                src="/plural-logotype-white.svg"
                height={20}
              />
            </TransitionText>
          </Flex>
        </Link>
        {/* ---
          NOTIFICATIONS AND UPDATE
        --- */}
        <Div
          py={0.75}
          px={0.75}
          flexShrink={0}
          borderBottom="1px solid border"
        >
          <SidebarItem
            active={activeId === 'notifications'}
            highlight={notificationsCount > 0}
            color="text-warning"
            collapsed={collapsed}
            startIcon={<LightningIcon />}
            label="Notifications"
            tooltip="Notifications"
            badge={notificationsCount}
            onClick={onNotificationsClick}
          />
          {hasUpdate && (
            <SidebarItem
              mt={0.25}
              highlight
              collapsed={collapsed}
              startIcon={<DownloadIcon />}
              label="Update"
              tooltip="Update"
              onClick={onUpdateClick}
            />
          )}
        </Div>
        {/* ---
          MENU
        --- */}
        <Div
          py={0.75}
          px={0.75}
          flexGrow={1}
          flexShrink={1}
          overflowY="auto"
          overflowX="hidden"
          borderBottom="1px solid border"
          {...{
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            '&::-webkit-scrollbar-thumb': {
              display: 'none',
            },
          }}
        >
          {items.map(({ name, Icon, url, urlRegexp }) => (
            <SidebarItem
              key={name}
              marginBottom="xsmall"
              active={activeId.startsWith(url) || urlRegexp?.test(activeId)}
              collapsed={collapsed}
              startIcon={<Icon />}
              label={name}
              tooltip={name}
              linkTo={url}
            />
          ))}
        </Div>
        {/* ---
          SOCIAL
        --- */}
        <Div
          py={0.75}
          px={0.75}
          flexShrink={0}
          borderBottom="1px solid border"
        >
          <SidebarItem
            mb={0.25}
            collapsed={collapsed}
            startIcon={<DiscordIcon />}
            endIcon={(
              <ArrowTopRightIcon
                size={24}
                my={`${(16 - 24) / 2}px`}
              />
            )}
            label="Discord"
            tooltip="Discord"
            linkTo="https://discord.com/invite/qsUfBcC3Ru"
          />
          <SidebarItem
            collapsed={collapsed}
            startIcon={<GitHubLogoIcon />}
            endIcon={(
              <ArrowTopRightIcon
                size={24}
                my={`${(16 - 24) / 2}px`}
              />
            )}
            label="GitHub"
            tooltip="GitHub"
            linkTo="https://github.com/pluralsh/plural"
          />
        </Div>
        {/* ---
          COLLAPSE
        --- */}
        <Div
          pt={0.75}
          px={0.75}
          flexShrink={0}
        >
          <SidebarItem
            collapsed={collapsed}
            startIcon={collapsed ? <HamburgerMenuCollapsedIcon /> : <HamburgerMenuCollapseIcon />}
            label="Collapse"
            tooltip="Expand"
            backgroundColor="fill-one"
            _hover={{
              backgroundColor: 'transparency(fill-one-hover, 50)',
            }}
            border="1px solid border"
            onClick={() => setCollapsed(x => !x)}
          />
        </Div>
        {/* ---
          USER
        --- */}
        <Div
          py={0.5}
          px={0.5}
          flexShrink={0}
        >
          <SidebarItem
            ref={menuItemRef}
            py={0.25 / 2}
            px={0.5}
            active={isMenuOpen}
            collapsed={collapsed}
            startIcon={(
              <Avatar
                src={userImageUrl}
                name={userName}
                flexShrink={0}
                size={32}
              />
            )}
            label={(
              <Div>
                <Div
                  collapsed={collapsed}
                  color="text-strong"
                  fontWeight={500}
                  wordBreak="keep-all"
                >
                  {userName}
                </Div>
                {userAccount && (
                  <Div
                    body3
                    collapsed={collapsed}
                    color="text-xlight"
                    wordBreak="keep-all"
                  >
                    {userAccount}
                  </Div>
                )}
              </Div>
            )}
            onClick={() => setIsMenuOpened(x => !x)}
          />
        </Div>
      </Flex>
      {/* ---
        MENU
      --- */}
      {isMenuOpen && (
        <Menu
          ref={menuRef}
          zIndex={999}
          position="absolute"
          bottom={8}
          minWidth="175px"
          left={sidebarWidth + 8}
          border="1px solid border"
        >
          <MenuItem
            as={Link}
            to="/profile"
            color="inherit"
            textDecoration="none"
          >
            <PersonIcon mr={1} />
            My profile
          </MenuItem>
          <MenuItem
            as="a"
            href="https://docs.plural.sh"
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
            textDecoration="none"
          >
            <ScrollIcon mr={1} />
            Docs
            <Flex flexGrow={1} />
            <ArrowTopRightIcon size={20} />
          </MenuItem>
          {/* <MenuItem>
            <MarketPlusIcon mr={1} />
            Create new publisher
          </MenuItem> */}
          {!!previousUserData && (
            <MenuItem onClick={handlePreviousUserClick}>
              <LogoutIcon mr={1} />
              Log back as {previousUserData.me.email}
            </MenuItem>
          )}
          <MenuItem
            onClick={handleLogout}
            color="icon-error"
          >
            <LogoutIcon mr={1} />
            Logout
          </MenuItem>
        </Menu>
      )}
    </>
  )
}

export default SidebarWrapper
