import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';

@Component({
  selector: 'app-locmaster',
  templateUrl: './locmaster.page.html',
  styleUrls: ['./locmaster.page.scss'],
})
export class LocmasterPage implements OnInit {
  // Array to store table data
  distanceList: Array<{ sNo: number; from: string; to: string; distance: number }> = [];

  // Counter for serial numbers
  private serialCounter: number = 1;

  constructor() {}

  ngOnInit() {}

  // Method to handle form reset
  entry_reset_form() {
    this.resetFormFields();
    $('#from').val('');
    $('#to').val('');
    $('#distance').val('');
  }

  // Method to clear the form fields
  resetFormFields() {
    $('#from').val('');
    $('#to').val('');
    $('#distance').val('');
  }

  // Method to handle the Add button click
  addEntry() {
    const from = $('#from').val() as string;
    const to = $('#to').val() as string;
    const distance = parseFloat($('#distance').val() as string);

    if (!from.trim() || !to.trim() || isNaN(distance)) {
      alert('All fields are required!');
      return;
    }

    // Add the new entry to the table data
    this.distanceList.push({
      sNo: this.serialCounter++,
      from,
      to,
      distance,
    });

    // Clear the form after adding the entry
    this.resetFormFields();
  }
}
