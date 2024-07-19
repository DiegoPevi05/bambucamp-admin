import { cn } from '../../lib/utils'
import { cva, VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, FC } from 'react'

export const buttonVariants = cva(
  'active:scale-95 disabled:before:bg-gray-500 disabled:border-gray-500 disabled:opacity-50 disabled:pointer-events-none disabled:bg-gray-200 disabled:text-gray-500 border border-[3px]',
  {
    variants: {
      effect:{
        slide: 'button',
        default: '',
      },
      variant: {
        default: 'button-primary',
        dark: 'button-dark',
        light: 'button-light',
        ghost: 'button-ghost',
        ghostLight: 'button-ghost-light',
        danger: 'button-danger',
      },
      isRound: {
        true: 'rounded-md',
        false: '',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-2',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      effect: 'slide',
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  rightIcon?: React.ReactNode
}

const Button: FC<ButtonProps> = ({
  className,
  children,
  variant,
  isLoading,
  size,
  effect,
  isRound,
  rightIcon,
  ...props
}) => {

  return (
    <button
      className={cn(buttonVariants({ variant, size, effect, isRound, className }))}
      disabled={isLoading}
      {...props}>
      <span className="flex justify-center items-center gap-x-2">
      {isLoading ? <Loader2 className='mr-2 text-secondary h-4 w-4 animate-spin' /> : null}
      {children}
      {rightIcon ? <div className="transform transition-transform group-hover:translate-x-2 duration-300">{rightIcon}</div> : null}
      </span>
    </button>
  )
}

export default Button
