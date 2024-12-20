import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss'],
})
export class TreeComponent {
  @Input() data: any[] = [];
  @Input() parentId: number | null = null; 

  // Maintain the state of expanded nodes
  expandedNodes: { [key: number]: boolean } = {};

  // Get nodes for the current level
  get currentNodes() {
    return this.data.filter((item) => item.parent_id === this.parentId);
  }

  // Toggle the expanded state of a node
  toggleNode(nodeId: number): void {
    this.expandedNodes[nodeId] = !this.expandedNodes[nodeId];
  }

  // Get child nodes for a given parent ID
  hasChildren(nodeId: number): boolean {
    return this.data.some((item) => item.parent_id === nodeId);
  }
}



