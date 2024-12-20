import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, SearchbarCustomEvent } from '@ionic/angular';

@Component({
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  selector: 'app-searchable-select',
  templateUrl: './searchable-select.component.html',
  styleUrls: ['./searchable-select.component.scss'],
})
export class SearchableSelectComponent implements OnChanges {
  @Input() title = "Search";
  @Input() placeholder = "Search";
  @Input() data : any[] = [];
  @Input() multiple = false;
  @Input() showSelectAll = false;
  @Input() DarkPlaceHolder = false
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

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log(changes)
    this.filtered = this.data;
    // this.selectedItems = this.filtered.filter(item => item.selected)
  }

  open() {
    if(!this.isDisabled) {
      this.isOpen = true;
      // console.log(this.data, this.selectedItems)
      this.filtered = this.data;
    }
  }

  clear() {
    this.selectedItems = [];
    this.selectAll = false
    this.data.forEach((item) => item.selected = false);
    this.selectedChanged.emit(this.selectedItems);
  }

  cancel() {
    this.isOpen = false;
    // this.filtered = this.data;
  }

  select() {
    this.isOpen = false;
    this.selectedItems = this.data.filter((item) => item.selected);
    this.selectedChanged.emit(this.selectedItems);
  }

  setSelection(items: any[]) {
    let selIdList = items.map(x => this.leaf(x, this.uniqueKeyField));
    // console.log(selIdList);

    this.data.forEach((item) => {
      item.selected = false;
      if(selIdList.indexOf(this.leaf(item, this.uniqueKeyField)) > -1 )
        item.selected = true;
    });

    this.selectedItems = this.data.filter((item) => item.selected);
    this.selectedChanged.emit(this.selectedItems);
  }

  /*
  leaf(obj, path) {
    // console.log(obj,path)
    return path.split('.').reduce((value, el) => value[el], obj);
  }
  */
  leaf(obj:any, pathFn:Function) {
    // console.log(obj,pathfn)
    return pathFn(obj);
  }

  itemSelection() {

    if(this.selectAll == true)
    {
      this.selectAll = false
    }


    if(!this.multiple){
      // console.log('itemselection')
      
      if(this.selectedItems.length) {
        this.selectedItems[0].selected = false;
      }

      this.selectedItems = this.data.filter((item) => item.selected);
      this.selectedChanged.emit(this.selectedItems);
      if(this.selectedItems.length) {
        this.isOpen = false;
      }
    } else {
      this.selectedItems = this.data.filter((item) => item.selected);
      this.selectedChanged.emit(this.selectedItems);

      if(this.selectedItems.length) {
        this.showSelect = true
      }
      else{
        this.showSelect = false
      }
    }
  }

  itemSelectAll()
  {

    if(this.selectAll == true)
    {
      this.data.forEach((item) => item.selected = true);
      this.selectedItems = this.data
      this.showSelect = true
      this.selectedChanged.emit(this.selectedItems);
    }
    else if(this.selectAll == false)
    {
      this.data.forEach((item) => item.selected = false);
      this.selectedItems = []
      this.showSelect = false
      this.selectedChanged.emit(this.selectedItems);
    }
    
  }

  filter(ev: SearchbarCustomEvent) {
    let str :string = ev?.detail?.value || "";  
    const searchfilter = str.toLowerCase();
    this.filtered = this.data.filter(item => {
      return this.leaf(item, this.itemTextField).toLowerCase().indexOf(searchfilter) >= 0
    });
  }
}

