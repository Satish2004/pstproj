import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import * as $ from 'jquery';

@Component({
  selector: 'app-pagination-component',
  templateUrl: './pagination-component.component.html',
  styleUrls: ['./pagination-component.component.scss'],
})
export class PaginationComponentComponent implements OnInit, OnChanges {
  @Input() data = [];
  @Input() total_data_count = 99999;
  @Input() pagination_reset!: boolean;
  @Output() pageChanged: EventEmitter<any> = new EventEmitter();

  pagination_visible: boolean = false;
  totalLength: number = 0;
  pang_no_limit: number = 0;
  temp_total_data_count = this.total_data_count;

  PrevPlus = '<<';
  Prev = '<';
  Next = '>';
  NextPlus = '>>';

  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.temp_total_data_count != this.total_data_count) {
      this.pagination_reset = true;
      this.temp_total_data_count = this.total_data_count;
    }

    if (this.data.length >= 10) {
      this.pagination_visible = true;
    }

    if (this.pagination_reset == true) {
      this.pag_no = 1;
      this.pagination_reset = false;
    }

    this.totalLength = this.data.length;

    if (this.total_data_count % 10 == 0) {
      this.pang_no_limit = this.parseInt(this.total_data_count / 10);
    } else {
      this.pang_no_limit = this.parseInt(this.total_data_count / 10) + 1;
    }
  }

  pag_no = 1;

  // For pagination
  pagenation($event: MouseEvent): void {
    var page_no = ($event.target as HTMLElement).innerHTML;

    if (page_no == '>>') {
      if (this.total_data_count == 99999) {
        this.pag_no = this.pag_no + 1;
      } else {
        this.pag_no = this.pang_no_limit;
      }
    } else if (page_no == '<<') {
      this.pag_no = 1;
      this.pageChanged.emit(0);
    } else if (page_no == '>') {
      if (this.pag_no < this.pang_no_limit) {
        this.pag_no = this.parseInt(this.pag_no) + 1;
      } else {
        this.pag_no = this.parseInt(this.pag_no);
      }
    } else if (page_no == '<') {
      if (this.pag_no <= 1) {
        this.pag_no = 1;
      } else {
        this.pag_no = this.parseInt(this.pag_no) - 1;
      }
    } else {
      this.pag_no = this.parseInt(page_no);
    }

    var p_no = this.pag_no * 10 - 10;

    if (p_no >= 0 && p_no < this.total_data_count) {
      this.pageChanged.emit(p_no);
    } else {
      $event.preventDefault();
    }
  }

  parseInt(x: string | number): number {
    return Number.parseInt(x.toString());
  }
}
