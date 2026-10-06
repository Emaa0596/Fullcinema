import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Profile } from './pages/profile/profile';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
    {path: '', pathMatch: 'full', redirectTo: 'home'},
    {path: 'home', component: Home},
    {path: 'login', component: Login, canActivate: [guestGuard]},
    {path: 'register', component: Register, canActivate: [guestGuard]},
    {path: 'profile',component: Profile, canActivate: [authGuard]}
];
