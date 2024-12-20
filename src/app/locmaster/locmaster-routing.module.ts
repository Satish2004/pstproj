import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LocmasterPage } from './locmaster.page';

const routes: Routes = [
  {
    path: '',
    component: LocmasterPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LocmasterPageRoutingModule {}
