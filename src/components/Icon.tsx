import { ComponentProps, FC } from 'react'
import Check from '../assets/check.svg?react'
import Color from '../assets/color.svg?react'
import Ellipsis from '../assets/ellipsis.svg?react'
import Eraser from '../assets/eraser.svg?react'
import Hand from '../assets/hand.svg?react'
import Lasso from '../assets/lasso.svg?react'
import Locked from '../assets/locked.svg?react'
import PalmRejection from '../assets/palm-rejection.svg?react'
import Pen from '../assets/pen.svg?react'
import Plus from '../assets/plus.svg?react'
import Redo from '../assets/redo.svg?react'
import Undo from '../assets/undo.svg?react'
import Unlocked from '../assets/unlocked.svg?react'
import User from '../assets/user.svg?react'
import ZoomIn from '../assets/zoom-in.svg?react'
import ZoomOut from '../assets/zoom-out.svg?react'

const icons = {
  check: Check,
  color: Color,
  ellipsis: Ellipsis,
  eraser: Eraser,
  hand: Hand,
  lasso: Lasso,
  locked: Locked,
  palmRejection: PalmRejection,
  pen: Pen,
  plus: Plus,
  redo: Redo,
  undo: Undo,
  unlocked: Unlocked,
  user: User,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut
} as const

type Props = ComponentProps<'svg'> & {
  name: keyof typeof icons
}

export const Icon: FC<Props> = ({ name, ...props }) => {
  const Component = icons[name]
  return <Component {...props} />
}
