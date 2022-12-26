import type { Employee } from "../interfaces/Employee";
import type { IEmployeeOrgApp } from "../interfaces/IEmployeeOrgApp";
import type { CachedAction } from "../interfaces/IHistory";

export default class EmployeeOrgApp implements IEmployeeOrgApp {
  private history: Array<CachedAction | null> = [null];
  private lastActionIndex = 0;

  ceo: Employee;
  constructor(ceo: Employee) {
    this.ceo = ceo;
  }

  // move methods
  move(employeeID: number, supervisorID: number): void {
    // apply quick checks on the inputs:
    if (employeeID === this.ceo.uniqueId) {
      throw new Error("The CEO cannot be supervised.");
    }
    if (employeeID === supervisorID) {
      throw new Error("An employee can not be supervised by himself");
    }

    // since this is a new move, we must clear the actions after the previous action
    if (this.lastActionIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.lastActionIndex + 1);
    }

    // before any move:
    // cash the supervisor and the subordinated of the employee
    // needed later for the undo action
    const employeeInfo = this.findEmployee(employeeID);
    const cashedSupervisor = employeeInfo.supervisor;
    const cashedSubordinates = employeeInfo.employee.subordinates;

    const initMove = (
      employeeID: number,
      supervisorID: number,
      onlyEmployee = true // to move the employee only without its subordinates.
    ): void => {
      const employeeInfo = this.findEmployee(employeeID);
      const supervisorInfo = this.findEmployee(supervisorID);

      if (employeeInfo.supervisor.uniqueId === supervisorID) return;

      const { employee, supervisor } = employeeInfo;
      const { employee: comingSupervisor } = supervisorInfo;

      // remove the employee from old supervisor
      supervisor.subordinates = supervisor.subordinates.filter(
        (sub) => sub.uniqueId !== employeeID
      );

      if (onlyEmployee) {
        // merge subordinates of the employee with subordinates of supervisor
        supervisor.subordinates.push(...employee.subordinates);
        // detach the employee from its subordinates
        employee.subordinates = [];
      }

      // push employee to the subordinates of the comingSupervisor
      comingSupervisor.subordinates.push(employee);
    };

    const undo = () => {
      initMove(employeeID, cashedSupervisor.uniqueId);
      cashedSubordinates.forEach((sub) => {
        // onlyEmployee is false so they move back with their subordinates
        initMove(sub.uniqueId, employeeID, false);
      });
    };

    const redo = () => {
      initMove(employeeID, supervisorID);
    };

    const action: CachedAction = {
      undo,
      redo
    };
    this.history.push(action);
    this.lastActionIndex += 1;

    initMove(employeeID, supervisorID);
  }

  search(
    employeeID: number,
    child: Employee = this.ceo,
    parent: Employee = this.ceo
  ): { employee: Employee; supervisor: Employee } | null {
    let searchResult = null;
    if (child && child.uniqueId === employeeID) {
      searchResult = {
        employee: child,
        supervisor: parent
      };
    } else if (child.subordinates.length > 0) {
      let subSearchResult = null;
      child.subordinates.some(
        (sub) => (subSearchResult = this.search(employeeID, sub, child))
      );
      searchResult = subSearchResult;
    }
    return searchResult;
  }

  findEmployee(
    employeeID: number
  ): { employee: Employee; supervisor: Employee } {
    const searchResult = this.search(employeeID);
    if (!searchResult) {
      throw new Error(`No matching result to id: ${employeeID}.`);
    }
    return searchResult;
  }

  undo() {
    if (this.lastActionIndex > 0) {
      this.history[this.lastActionIndex]?.undo();
      this.lastActionIndex -= 1;
    }
  }

  redo() {
    // check that the move we want to redo is not the last move attempted.
    if (this.lastActionIndex < this.history.length - 1) {
      this.lastActionIndex += 1;
      this.history[this.lastActionIndex]?.redo();
      
    }
  }
}
