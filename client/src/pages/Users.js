import React from 'react'
import Header from '../components/Header'

export default function Users({currentUser}) {
  return (
    <div>
      <Header currentUser={currentUser}/>
    </div>
  )
}
