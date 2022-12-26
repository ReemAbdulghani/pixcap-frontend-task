import { describe, expect, it } from "vitest";
import { generateEmployees } from "./employeesGenerator";
import EmployeeOrgApp from "../classes/EmployeeOrgApp";
import type{ Employee } from "../interfaces/Employee";

describe("Demonstrate EmployeeOrgApp class instantiation ", () => {
  it("Instantiate with the CEO", () => {
    const org = generateEmployees()
    const app = new EmployeeOrgApp(org.root);
    expect(app.ceo).toMatchObject(org.root);
  });
});

describe("Demonstrate the move, undo, and redo methods", () => {
  it('Move Georgina to Bob', () => {
    const org = generateEmployees()
    const app = new EmployeeOrgApp(org.root)
    const {
      employee: bob,
      supervisor: bobOldSupervisor,
    } = app.findEmployee(org.bob.uniqueId) as { employee: Employee; supervisor: Employee }
    const bobOldSupervisorSubs = [...bobOldSupervisor.subordinates].filter(sub => sub.uniqueId !== org.bob.uniqueId)
    const bobOldSubordinates = [...bob.subordinates]
    app.move(org.bob.uniqueId, org.georgina.uniqueId)
    const {
      employee: georgina,
    } = app.findEmployee(org.georgina.uniqueId) as { employee: Employee; supervisor: Employee }
    expect(georgina.subordinates).toContainEqual(org.bob)
    expect(bobOldSupervisor.subordinates).not.toContainEqual(org.bob)
    const expectedBobOldSupervisorSubs = [...bobOldSupervisorSubs, ...bobOldSubordinates]
    expect(bobOldSupervisor.subordinates).toEqual(expect.arrayContaining(expectedBobOldSupervisorSubs))
  });
  
  it('undo moving Georgina to Bob', () => {
    const org = generateEmployees()
    const app = new EmployeeOrgApp(org.root)
    const {
      employee: bob,
      supervisor: bobOldSupervisor,
    } = app.findEmployee(org.bob.uniqueId) as { employee: Employee; supervisor: Employee }
    const bobOldSupervisorSubs = [...bobOldSupervisor.subordinates]
    const bobOldSubordinates = [...bob.subordinates]

    app.move(org.bob.uniqueId, org.georgina.uniqueId)
    app.undo()
    expect(bobOldSupervisor.subordinates).toContainEqual(org.bob)
    expect(bob.subordinates).toEqual(expect.arrayContaining(bobOldSubordinates))
    expect(bobOldSupervisor.subordinates).toEqual(expect.arrayContaining(bobOldSupervisorSubs))
  });

  it('redo moving Georgina to Bob', () => {
    const org = generateEmployees()
    const app = new EmployeeOrgApp(org.root)
    const {
      employee: bob,
      supervisor: bobOldSupervisor,
    } = app.findEmployee(org.bob.uniqueId) as { employee: Employee; supervisor: Employee }
    const bobOldSupervisorSubs = [...bobOldSupervisor.subordinates].filter(sub => sub.uniqueId !== org.bob.uniqueId)
    const bobOldSubordinates = [...bob.subordinates]
    app.move(org.bob.uniqueId, org.georgina.uniqueId)
    app.undo()
    app.redo()
    const {
      employee: georgina,
    } = app.findEmployee(org.georgina.uniqueId) as { employee: Employee; supervisor: Employee }
    expect(georgina.subordinates).toContainEqual(org.bob)
    const expectedBobOldSupervisorSubs = [...bobOldSupervisorSubs, ...bobOldSubordinates]
    expect(bobOldSupervisor.subordinates).toEqual(expect.arrayContaining(expectedBobOldSupervisorSubs))
  });
});

describe("Demonstrate handling some exceptional cases", () => {
    it('Cannot move the CEO', () => {
      const org = generateEmployees()
      const app = new EmployeeOrgApp(org.root)
      expect(() => {
        app.move(org.root.uniqueId, org.bob.uniqueId)
      }).toThrowError('The CEO cannot be supervised.')
    })
  
    it('search for invalid employee ID', () => {
      const org = generateEmployees()
      const app = new EmployeeOrgApp(org.root)
      const notFoundEmployee = app.search(2022)
      expect(notFoundEmployee).toEqual(null)
    })
  
    it('moving invalid employee', () => {
      const org = generateEmployees()
      const app = new EmployeeOrgApp(org.root)
      expect(() => {
        app.move(2022, org.bob.uniqueId)
      }).toThrowError('No matching result to id: 2022.')
    })
  
    it('move an employee to itself', () => {
      const org = generateEmployees()
      const app = new EmployeeOrgApp(org.root)
      expect(() => {
        app.move(org.bob.uniqueId, org.bob.uniqueId)
      }).toThrowError('An employee can not be supervised by himself')
    })
});
