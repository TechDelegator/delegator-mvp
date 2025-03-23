import type { Route } from "./+types/home";
import { UserList } from "../screens/userList";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Leave Management System" },
    { name: "description", content: "A simple leave management application" },
  ];
}

export default function Home() {
  return <UserList />;
}
