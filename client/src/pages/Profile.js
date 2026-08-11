import React from 'react'
import Header from '../components/Header'

export default function Profile({currentUser}) {
  return (
    <div>
      <Header currentUser={currentUser}/>
    </div>
  )
}
