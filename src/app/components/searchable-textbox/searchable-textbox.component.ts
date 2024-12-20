
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as $ from 'jquery';
import { ServiceService } from 'src/app/mastermodule/service/service.service';


@Component({
  selector: 'app-searchable-textbox',
  templateUrl: './searchable-textbox.component.html',
  styleUrls: ['./searchable-textbox.component.scss'],
})
export class SearchableTextboxComponent implements OnChanges {

  @Input() title = "Search";
  @Input() placeholder = "Search";
  @Input() id ="supplier_name"
  @Input() TextSugesionArray : any[] = [];
  @Input() existing_data_list : any[] = [];
  @Input() multiple = false;

  @Input() itemTextField = (x:any) => x.name;
  @Input() uniqueKeyField = (x:any) => x.id;
  // @Input() backdropDismiss = true;
  @Output() selectedChanged: EventEmitter<any> = new EventEmitter();
  @Input() isDisabled = false;

  selectAll = false
  isOpen = false;
  // selection: any;
  selectedItems: any[] = [];
  filtered: any[] = [];

  showSelect = false

  constructor(
    private api: ServiceService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log(changes)
    // this.filtered = this.data;
  }

  FetchItemDetailsSearchTextBox(event)
  {
    var val = event.target.value

    if (val == '')
    {
      this.TextSugesionArray =[]
    }
    else
    {
      try{
        this.TextSugesionArray = this.existing_data_list.filter(item => item.supplier_name.toUpperCase().includes(val.toUpperCase()))
      }
      catch
      {
        this.TextSugesionArray =[]
      }
    }

  }

  SelectSugesion(data)
  {
    $('#supplier_name').val(data)
    $('#supplier_name').focus()

    this.TextSugesionArray =[]

  }

  check_Name_exist(event)
  {

    var val = event.target.value
    var suggestion_box = document.getElementById('suggestion_box');

    var match = this.existing_data_list.filter(item => item.supplier_name.toUpperCase() == val.toUpperCase())

    if(suggestion_box.matches(":hover")) {
      return true
    }

    if(match[0])
    {
      this.api.alert.warningAlert({
        text: 'Supplier Name Already Exists',
        action: 'warning',
        callback: () => {
          setTimeout(function () {
            $('#supplier_name').focus();
          }, 500);
        },
      });

      return true
    }

  }

}