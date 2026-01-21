import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { RecipeListComponent } from './features/recipes/recipe-list/recipe-list';
import { RecipeDetailComponent } from './features/recipes/recipe-detail/recipe-detail';
import { RecipeFormComponent } from './features/recipes/recipe-form/recipe-form';
import { ProfileComponent } from './features/profile/profile';
import { ContactComponent } from './features/contact/contact';
import { TestNotificationsComponent } from './features/test-notifications/test-notifications';
import { authGuard, adminGuard } from './core/guards/auth';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'test-notifications', component: TestNotificationsComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'recipes', component: RecipeListComponent, canActivate: [authGuard] },
  { path: 'recipes/new', component: RecipeFormComponent, canActivate: [authGuard] },
  { path: 'recipes/:id', component: RecipeDetailComponent, canActivate: [authGuard] },
  { path: 'recipes/:id/edit', component: RecipeFormComponent, canActivate: [authGuard] },
  { 
    path: 'admin', 
    loadComponent: () => import('./features/admin/admin-users/admin-users').then(m => m.AdminUsersComponent),
    canActivate: [adminGuard] 
  },
  { path: '**', redirectTo: '' }
];
