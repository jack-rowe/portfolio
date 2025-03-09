import { NextRequest } from "next/server";
import { Todo } from "@/app/types";

// Reference to the in-memory todos array from the main route
declare let todos: Todo[];

// Get a specific todo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const todo = todos.find((t) => t.id === params.id);
  
  if (!todo) {
    return Response.json(
      { message: "Todo not found" },
      { status: 404 }
    );
  }

  return Response.json({ todo });
}

// Update a todo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const todoIndex = todos.findIndex((t) => t.id === params.id);

    if (todoIndex === -1) {
      return Response.json(
        { message: "Todo not found" },
        { status: 404 }
      );
    }

    const updatedTodo = {
      ...todos[todoIndex],
      ...body,
      updatedAt: new Date(),
    };

    todos[todoIndex] = updatedTodo;

    return Response.json({ todo: updatedTodo });
  } catch (error) {
    return Response.json(
      { message: "Error updating todo", error },
      { status: 500 }
    );
  }
}

// Delete a todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const todoIndex = todos.findIndex((t) => t.id === params.id);

  if (todoIndex === -1) {
    return Response.json(
      { message: "Todo not found" },
      { status: 404 }
    );
  }

  todos.splice(todoIndex, 1);

  return Response.json(
    { message: "Todo deleted successfully" },
    { status: 200 }
  );
} 