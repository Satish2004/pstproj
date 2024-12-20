import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocmasterPage } from './locmaster.page';

describe('LocmasterPage', () => {
  let component: LocmasterPage;
  let fixture: ComponentFixture<LocmasterPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LocmasterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
