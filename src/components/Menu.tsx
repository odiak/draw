import styled from 'styled-components'

export const Menu = styled.ul`
  padding: 0;
  list-style: none;
  position: absolute;
  right: 0;
  top: 100%;
  background: #fff;
  border: 1px solid #ccc;
  margin: 0;
  box-shadow: 0 0 6px #0004;
  z-index: 100;
  font-size: 16px;
  width: max-content;
  text-align: left;
  min-width: 160px;
  display: none;
`

export const MenuItem = styled.li`
  padding: 6px 8px;
  cursor: pointer;

  &:hover {
    background: #eee;
  }
`

export const MenuItemText = styled.li`
  padding: 6px 8px;
`

export const MenuItemWithAnchor = styled.li`
  padding: 0;
  cursor: pointer;

  &:hover {
    background: #eee;
  }

  & > a:link,
  & > a:visited {
    padding: 6px 8px;
    color: inherit;
    text-decoration: none;
    display: block;
  }
`

export const MenuDivider = styled.div`
  height: 1px;
  background: #ccc;
`
