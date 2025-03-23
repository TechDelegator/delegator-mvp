import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("./employee/layout.tsx", [
    route('dashboard/employee', "./employee/dashboard.tsx")
  ]
  )
] satisfies RouteConfig;
