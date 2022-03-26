import {
  HamburgerIcon,
  AddIcon,
  ExternalLinkIcon,
  RepeatIcon,
  EditIcon,
} from '@chakra-ui/icons';
import {
  Menu,
  MenuButton,
  IconButton,
  MenuList,
  MenuItem,
  Button,
  Flex,
  Link,
  Box,
  Icon,
} from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { MeQuery } from '../generated/graphql';

interface MenuBtnProps {
  data: MeQuery | undefined;
  fetching: boolean;
  logout: any;
}

export const MenuBtn: React.FC<MenuBtnProps> = ({ data, fetching, logout }) => {
  const router = useRouter();
  let body = null;
  // data is loading
  if (fetching) {
    //user not logged in
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <MenuItem>
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
            <Link ml={2}>Login</Link>
          </MenuItem>
        </NextLink>
        <NextLink href="/register">
          <MenuItem>
            <FontAwesomeIcon icon={faUserPlus} />
            <Link ml={2}>Register</Link>
          </MenuItem>
        </NextLink>
      </>
    );
    //user is logged in
  } else {
    body = (
      <>
        <MenuItem>
          <FontAwesomeIcon icon={faUserCheck} />
          <Box ml={2}>{data?.me?.username}</Box>
        </MenuItem>
        <NextLink href="create-post">
          <MenuItem>
            <FontAwesomeIcon icon={faCirclePlus} />
            <Link ml={2}>create post</Link>
          </MenuItem>
        </NextLink>
        <MenuItem
          onClick={async () => {
            await logout();
            router.reload();
          }}
        >
          <FontAwesomeIcon icon={faArrowRightToBracket} />
          <Box ml={2}>logout</Box>
        </MenuItem>
      </>
    );
  }
  return (
    <>
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label="Options"
          icon={<HamburgerIcon color="#004E7C" />}
          variant="outline"
          bg="#dce1e3"
        />
        <MenuList>{body}</MenuList>
      </Menu>
    </>
  );
};
