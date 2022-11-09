import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { Button, Form, Input } from 'ui'
import * as yup from 'yup'
import YupPassword from 'yup-password'

// extend yup with password validation
YupPassword(yup)

const signUpSchema = yup.object({
  email: yup.string().email().required().label('Email'),
  password: yup.string().password().required().label('Password'),
})

const SignUpForm = () => {
  const { ui } = useStore()
  const router = useRouter()

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  const onSignUp = async ({ email, password }: { email: string; password: string }) => {
    const toastId = ui.setNotification({
      category: 'loading',
      message: `Signing up...`,
    })

    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    const response = await post(`${API_URL}/signup`, {
      email,
      password,
      hcaptchaToken: token ?? null,
    })
    const error = response.error

    if (!error) {
      ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Signed successfully! Please confirm your email before signing in`,
      })

      await router.push('/sign-in')
    } else {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()

      ui.setNotification({
        id: toastId,
        category: 'error',
        message: error.message,
      })
    }
  }

  return (
    <Form
      validateOnBlur
      id="signUp-form"
      initialValues={{ email: '', password: '' }}
      validationSchema={signUpSchema}
      onSubmit={onSignUp}
    >
      {({ isSubmitting }: { isSubmitting: boolean }) => {
        return (
          <div className="flex flex-col gap-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              disabled={isSubmitting}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              disabled={isSubmitting}
            />

            <div className="self-center">
              <HCaptcha
                ref={captchaRef}
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                size="invisible"
                onVerify={(token) => {
                  setCaptchaToken(token)
                }}
                onExpire={() => {
                  setCaptchaToken(null)
                }}
              />
            </div>

            <Button
              block
              form="signUp-form"
              htmlType="submit"
              size="large"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Sign Up
            </Button>
          </div>
        )
      }}
    </Form>
  )
}

export default SignUpForm
