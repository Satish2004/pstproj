import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocPage } from './loc.page';

describe('LocPage', () => {
  let component: LocPage;
  let fixture: ComponentFixture<LocPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LocPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
