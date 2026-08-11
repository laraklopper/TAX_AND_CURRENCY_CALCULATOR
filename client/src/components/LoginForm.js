import React from 'react'
import Stack from 'react-bootstrap/Stack';

export default function LoginForm() {
  return (
    <form>
        <div>
            <Stack gap={3}>
                <div className="p-2">First item</div>
                <div className="p-2">Second item</div>
                <div className="p-2">Third item</div>
            </Stack>
            <Stack gap={3}>
                <div className="p-2">First item</div>
                <div className="p-2">Second item</div>
                <div className="p-2">Third item</div>
            </Stack>
        </div>
        <div>
            <Stack gap={3}>
                <div className="p-2">
                    {/* LOGIN BUTTON */}
                </div>
                <div className="p-2"></div>
                <div className="p-2">
                    {/* Forgot password link */}
                </div>
            </Stack>
        </div>
    </form>
  )
}
