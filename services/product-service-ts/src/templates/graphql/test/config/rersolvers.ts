import { User } from '../models/user.js';
import { Todo } from '../models/todo.js';

export const resolvers = {
  Query: {
    users: async () => await User.find(),

    todos: async (_: any, { userId }: { userId: string }) =>
      await Todo.find({ userId }),

    todo: async (_: any, { id }: { id: string }) =>
      await Todo.findById(id),
  },

  Mutation: {
    createUser: async (_: any, args: { name: string; email: string; password: string }) => {
      const user = new User(args);
      return await user.save();
    },

    createTodo: async (_: any, args: { title: string; description?: string; userId: string }) => {
      const todo = new Todo(args);
      return await todo.save();
    },

    updateTodo: async (_: any, { id, ...updates }: any) =>
      await Todo.findByIdAndUpdate(id, updates, { new: true }),

    deleteTodo: async (_: any, { id }: { id: string }) => {
      await Todo.findByIdAndDelete(id);
      return `Todo ${id} deleted`;
    },
  },
};