// /app/providers.tsx
'use client';

import { client } from "@/lib/graphql/client";
import { ApolloProvider } from "@apollo/client/react";

export function Providers({ children }: { children: any }) {
    return (
        <>
            <ApolloProvider client={client}>{children}</ApolloProvider>
        </>
    );
}