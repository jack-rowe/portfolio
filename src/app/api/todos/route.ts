import { Todo } from "@/app/types";
import { NextRequest } from "next/server";

// In-memory storage for todos (replace with database in production)
const todos: Todo[] = [];

// List all todos
export async function GET() {
  return Response.json({ todos });
}

// Create a new todo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title) {
      return Response.json({ message: "Title is required" }, { status: 400 });
    }

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: body.title,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    todos.push(newTodo);

    return Response.json({ todo: newTodo }, { status: 201 });
  } catch (error) {
    return Response.json(
      { message: "Error creating todo", error },
      { status: 500 }
    );
  }
}
