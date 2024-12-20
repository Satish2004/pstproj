import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { TreeComponent } from './tree/tree.component';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  // {
  //   path: 'mod0238', // Define the route path for mod0238 page
  //   loadChildren: () => import('./mod0238/mod0238.module').then(m => m.Mod0238PageModule)
  // },
  {
    path: 'locmaster',
    loadChildren: () => import('./locmaster/locmaster.module').then( m => m.LocmasterPageModule)
  },
  {
    path: 'loc',
    loadChildren: () => import('./loc/loc.module').then( m => m.LocPageModule)
  },
  {
    path: '', // Define a route for TreeComponent
    component: TreeComponent, // Use the TreeComponent directly here
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
