import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ApolloProvider } from '@apollo/client/react'
import { client } from './lib/graphql/client.ts'

createRoot(document.getElementById('root')!).render(
    <ApolloProvider client={client}>
    <App />
    </ApolloProvider>
)
