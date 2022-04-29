import { initializeApp } from 'firebase/app'

initializeApp(JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG!))
