import type { Employee } from "./Employee";

export interface IEmployeeOrgApp {
  ceo: Employee;
  
  move(employeeID: number, supervisorID: number): void;
  undo(): void;
  redo(): void;
}
