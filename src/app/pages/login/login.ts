import { Component, inject } from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {RouterLink, RouterLinkActive} from "@angular/router";

@Component({
  imports: [],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  readonly auth = inject(AuthService);
}
