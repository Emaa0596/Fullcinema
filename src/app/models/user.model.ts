import { Role } from './role.models';

export class User {
  constructor(
    public nombre: string,
    public apellido: string,
    public nacimiento: Date,
    public email: string
  ) {}
}

export class RegisteredUser extends User {
  constructor(
    nombre: string,
    apellido: string,
    nacimiento: Date,
    email: string,
    public password: string,
    public rol: Role,
    public tipoDeSangre?: string,
    public colorDeOjos?: string,
    public vacaciones?: Number
  ) {
    super(nombre, apellido, nacimiento, email);
  }
}