import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LocmasterPageRoutingModule } from './locmaster-routing.module';

import { LocmasterPage } from './locmaster.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LocmasterPageRoutingModule
  ],
  declarations: [LocmasterPage]
})
export class LocmasterPageModule {}
