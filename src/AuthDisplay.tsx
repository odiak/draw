import React, { useEffect, useState, useCallback } from 'react'
import firebase from 'firebase/app'

export function AuthDisplay() {
  const [isAuthStateLoaded, setAuthStateLoaded] = useState(false)
  const [user, setUser] = useState(null as firebase.User | null)

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      setUser(user)
      setAuthStateLoaded(true)
    })
  }, [])

  const handleClickSignInButton = useCallback(async () => {
    firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
  }, [])

  const handleClickSignOutButton = useCallback(async () => {
    firebase.auth().signOut()
  }, [])

  if (!isAuthStateLoaded) {
    return <div>...</div>
  }

  return (
    <div>
      {user ? (
        <div>
          hello, {user.displayName}. <button onClick={handleClickSignOutButton}>sign out</button>
        </div>
      ) : (
        <button onClick={handleClickSignInButton}>sign in with Google</button>
      )}
    </div>
  )
}
