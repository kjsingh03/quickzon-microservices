// app.tsx
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useQuery } from "@apollo/client/react";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  user: {
    id: string;
    name: string;
  };
};

type GetTodosResponse = {
  getTodos: Todo[];
};

// /graphql/queries.ts
import { gql } from "@apollo/client";

export const GET_TODOS = gql`
  query GetTodos {
    getTodos {
      id
      title
      completed
      user {
        id
        name
      }
    }
  }
`;

export default function App() {
  const { data, loading, error, refetch } = useQuery<GetTodosResponse>(GET_TODOS, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>Todos</h1>

      <button className="bg-red-600 p-4 rounded-xl mb-3" onClick={() => refetch()}>Refetch</button>

      <div className="flex flex-col gap-5">
        {data?.getTodos.map((todo: Todo, idx) => (
          <div key={todo.id} className={`${idx & 1 ? 'bg-pink-600' : 'bg-red-600'}`}>
            <p>{todo.title}</p>
            <p>{todo.completed ? "✅" : "❌"}</p>
            <p>User: {todo.user.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}