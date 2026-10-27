import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Profile } from './pages/profile/profile';
import { authGuard, guestGuard } from './guards/auth.guard';
import { CompleteProfile } from './pages/complete-profile/complete-profile';
import { OauthCallback } from './pages/oauth-callback/oauth-callback';
import { adminGuard } from './guards/admin.guard';
import { Admin } from './pages/admin/admin';
import { Employee } from './pages/employee/employee';
import { employeeGuard } from './guards/employee.guard';
import { SeatSelection } from './pages/seat-selection/seat-selection';
import { Showtimes } from './pages/showtimes/showtimes';
import { PurchaseDetail } from './pages/purchase-detail/purchase-detail';
import { MyPurchases } from './pages/my-purchases/my-purchases';
import { Candy } from './pages/candy/candy';
import { AdminCandy } from './pages/admin-candy/admin-candy';

export const routes: Routes = [
    {path: '', pathMatch: 'full', redirectTo: 'home'},
    {path: 'home', component: Home},
    {path: 'login', component: Login, canActivate: [guestGuard]},
    {path: 'register', component: Register, canActivate: [guestGuard]},
    {path: 'profile',component: Profile, canActivate: [authGuard]},
    {path: 'complete-profile', component: CompleteProfile, canActivate: [authGuard]},
    {path: 'oauth-callback', component: OauthCallback},
    {path: 'admin', component: Admin, canActivate: [adminGuard]},
    {path: 'employee', component: Employee, canActivate: [employeeGuard]},
    {path: 'showtime/:id/seats',component: SeatSelection},
    {path: 'movies/:id/showtimes',  component: Showtimes},
    {path: 'purchase/:id', component: PurchaseDetail},
    {path: 'my-purchases', component: MyPurchases, canActivate: [authGuard]},
    {path: 'candy', component: Candy},
    {path: 'admin/candy', component: AdminCandy, canActivate: [adminGuard]}
];
