import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import * as $ from "jquery";
import { ServiceService } from 'src/app/service.service';

@Component({
  selector: 'app-searchbox',
  templateUrl: './searchbox.component.html',
  styleUrls: ['./searchbox.component.scss'],
})
export class SearchboxComponent implements OnInit {

  @Input() title: any = "";
  @Input() placeholder: any = "Enter Search Term";
  @Input() page_number: any = 0;

  @Input() cancel_id: any = "cancel_id";
  @Input() search_id: any = "search_id";

  
  @Input() searchText: any = ''

  @Input() data : any[] = [];

  @Input() searchEnabled = false;
  @Input() searchTextDisable = false;

  @Input() search_reset = false


  @Output() search_function: EventEmitter<any> = new EventEmitter();
  @Output() default_function: EventEmitter<any> = new EventEmitter();
  @Output() clear_function: EventEmitter<any> = new EventEmitter();

  // searchText : any =''

  event_object = {};

  

  constructor(private api: ServiceService,) { }

  ngOnInit() {
    $(".cancel_search_class").hide()
  }

  ngOnChanges(changes: SimpleChanges): void {
   
    if(this.search_reset == true)
    {
      this.clearsearch()
      this.search_reset = false
    }

  }


  clearsearch() {
    $("#search_list").val("")

    this.searchText='';
    this.searchEnabled = false;
    this.searchTextDisable=false

    $("#"+this.cancel_id).hide()
    $("#"+this.search_id).show()

    this.filter_tabel()

    this.clear_function.emit();
  }

  filter_tabel()
  {
    this.default_function.emit(this.searchText);
  }

  searchTable(po_no = 0, pg = 1) {

    if(this.searchText == '')
    {
      this.api.alert.warningAlert({
        text: "Please Enter Search Term",
        action: 'warning',
        callback:()=> {
          setTimeout(function () {
            $("#search_list").focus()
          }, 500);
        }
      })
      return;
    }

    this.searchEnabled = true;
    this.searchTextDisable = true;

    this.event_object = {
      'searchText': this.searchText,
      'page_number': this.page_number
    }

    this.search_function.emit(this.event_object);

    $("#"+this.cancel_id).show()
    $("#"+this.search_id).hide()
  }

}
