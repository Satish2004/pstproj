import { Component, OnInit, ViewChild, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-select-table-row',
  templateUrl: './select-table-row.component.html',
  styleUrls: ['./select-table-row.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule, MatCheckboxModule, MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule],
  standalone: true,
})

export class SelectTableRowComponent implements OnInit, AfterViewInit {

  @Input() displayedColumns: string[];
  @Input() columnValues: any;
  @Input() dataSet: any[];
  dataSource: MatTableDataSource<any>;
  // tableColumns: string[];

  // @ViewChild(MatPaginator) paginator: MatPaginator;
  // @ViewChild(MatSort) sort: MatSort;
  private paginator: MatPaginator;
  private sort: MatSort;

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }

  setDataSourceAttributes() {
    if (!this.dataSource)
      this.dataSource = new MatTableDataSource();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    if (this.paginator && this.sort) {
      this.filterChange(
        (document.querySelector('#filterElement') as HTMLInputElement).value
      );
    }
  }

  chkboxColName: string = "isChecked";
  isAllSelected: boolean = false;

  isOpen = false;
  selectedItems: any[] = [];

  @Input() buttonName: string = "";
  @Input() title = "";
  @Input() multipleSelect = false;
  @Input() validateToShowModal = (): boolean => {
    return true;
  }

  @Output() selectedChanged: EventEmitter<any> = new EventEmitter();


  constructor() {

  }

  ngOnInit() {
    if (!this.title)
      this.title = this.buttonName;
    this.displayedColumns.splice(0, 0, ...[this.chkboxColName, "S.No"])
  }

  /**
   * Set the paginator and sort after the view init since this component will
   * be able to query its view for the initialized paginator and sort.
   */
  ngAfterViewInit() {
    this.refreshDataSource(this.dataSet);
  }

  refreshDataSource(ds: any[]) {
    this.dataSource = new MatTableDataSource<any>(ds);
    // console.log(this.dataSource, this.dataSet)
    if (ds?.length) {
      // this.dataSource.paginator = this.paginator;
      // this.dataSource.sort = this.sort;
      this.setDataSourceAttributes()
    }
  }

  applyFilter(filterEv: Event | null) {
    let filterValue = (filterEv?.target as HTMLInputElement)?.value || "";
    this.filterChange(filterValue)
  }

  filterChange(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  changeCheckBox(chkValue: boolean, index: number, item: any) {
    console.log(this.dataSet, item, index, chkValue)
    // index is affected by filtering
    // chkValue = new value set in UI
    // dataSet is properly affected by chk boxes

    this.selectedItems = this.dataSet.filter((item) => item[this.chkboxColName]);
    this.selectedChanged.emit(this.selectedItems);
    if (!this.multipleSelect && this.selectedItems.length) {
      this.isOpen = false;
    }
  }

  changeAllCheckBoxes(chkValue: boolean) {
    console.log(chkValue)
    this.dataSet = this.dataSet.map(x => ({ ...x, [this.chkboxColName]: this.isAllSelected }))
    console.log('dataset', this.dataSet);
    (document.querySelector('#filterElement') as HTMLInputElement).value = "";
    this.refreshDataSource(this.dataSet);

    this.selectedItems = this.dataSet.filter(x => x[this.chkboxColName])
    this.selectedChanged.emit(this.selectedItems);
  }

  showModal() {
    this.isOpen = this.validateToShowModal();
    if (this.isOpen && !this.multipleSelect) {
      this.selectedItems = []
      if (this.dataSet?.length) {
        this.dataSet = this.dataSet.map(x => ({ ...x, [this.chkboxColName]: false }))
        this.refreshDataSource(this.dataSet)
      }
    }
  }

  select() {
    this.isOpen = false;

    this.selectedItems = this.dataSet.filter((item) => item[this.chkboxColName]);
    this.selectedChanged.emit(this.selectedItems);
  }

  cancel() {
    this.isOpen = false;
  }


  setSelection(items: any[]) {
    this.refreshDataSource(items)
    // console.log({ items, ds: this.dataSet })
    // this.selectedItems = this.dataSet.filter((item) => item[this.chkboxColName]);
    this.selectedItems = items.filter((item) => item[this.chkboxColName]);
    this.selectedChanged.emit(this.selectedItems);
  }

}
