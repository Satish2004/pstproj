import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  //constructor() {}
  treeData = [
    { id: 1, name: 'item 1', parent_id: null },
    { id: 2, name: 'Item 2', parent_id: null },
    { id: 3, name: 'child 1', parent_id: 1 },
    { id: 4, name: 'child 2', parent_id: 1 },
    { id: 5, name: 'child 3', parent_id: 2 },
    { id: 6, name: 'child 4 ', parent_id: 1 },
    { id: 7, name: 'child 5 ', parent_id: 2 },
    { id: 8, name: 'child 6', parent_id: 3 },
    { id: 9, name: 'child 7', parent_id: 3 },
    { id: 10, name: 'child 8 ', parent_id: 5 },
    { id: 11, name: 'child 9 ', parent_id: 5 }
  ];
}
