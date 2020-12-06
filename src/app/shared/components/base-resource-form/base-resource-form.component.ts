import { AfterContentChecked, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { BaseResourceModel } from '@shared/models/base-resource.model';
import { BaseResourceService } from "@shared/services/base-resource.service";

import { switchMap } from "rxjs/operators";

import toastr from "toastr";

export abstract class BaseResourceFormComponent<T extends BaseResourceModel> implements OnInit, AfterContentChecked {

  currentAction: string;
  resourceForm: FormGroup;
  pageTitle: string;
  serverErrorMessage: string[] = null;
  submittingForm: boolean = false;
    
  protected route: ActivatedRoute;
  protected router: Router;
  protected formBuilder: FormBuilder;

  constructor(
    protected injector: Injector,
    public resource: T,
    protected resourceService: BaseResourceService<T>,
    protected jsonDataToResourceFn: (jsonData) => T
  ) { 
    this.route = injector.get(ActivatedRoute);
    this.router = injector.get(Router);
    this.formBuilder = injector.get(FormBuilder);
  }
  
  ngOnInit() {
    this.setCurrentAction();
    this.buildResourceForm();
    this.loadResource();
  }

  ngAfterContentChecked() { 
    this.setPageTitle();
  }

  submitForm() {
    this.submittingForm = true;
    
    if (this.currentAction == "new")
      this.createResource();
    else
      this.updateResource();
  }

  //#PROTECTED METHODS
  
  protected setCurrentAction() {
    if (this.route.snapshot.url[0].path == 'new')
      this.currentAction = 'new'
    else
      this.currentAction = 'edit'
  }

  protected loadResource() {
    if (this.currentAction == 'edit') {
      this.route.paramMap.pipe(
        switchMap(params => this.resourceService.getById(+params.get('id')))
      )
      .subscribe(
        resource => {
          this.resource = resource;
          this.resourceForm.patchValue(this.resource);
        },
        error => {
          alert('Ocorreu um erro no servidor');
          console.log(error);
        }
      );
    }
  }

  protected setPageTitle() {
    if (this.currentAction == 'new')
      this.pageTitle = this.creationPageTitle();
    else
      this.pageTitle = this.editionPageTitle();
  }

  protected creationPageTitle(): string {
    return "Novo";
  }

  protected editionPageTitle(): string {
    return "Edição";
  }

  protected createResource() {
    const resource: T = this.jsonDataToResourceFn(this.resourceForm.value)

    this.resourceService.create(resource)
    .subscribe(
      resource => this.actionForSuccess(resource),
      error => this.actionsForError(error)
    );
  }

  protected updateResource() {
    const resource: T = this.jsonDataToResourceFn(this.resourceForm.value)

    this.resourceService.update(resource)
    .subscribe(
      resource => this.actionForSuccess(resource),
      error => this.actionsForError(error)
    );
  }

  protected actionForSuccess(resource: T) {
    toastr.success("Solicitação processada com sucesso");

    const baseComponentPath: string = this.route.snapshot.parent.url[0].path;

    //reload compoment page
    this.router.navigateByUrl(baseComponentPath, { skipLocationChange: true }).then(
      () => this.router.navigate([baseComponentPath, resource.id, "edit"])
    );
  }
  
  protected actionsForError(error: any) {
    toastr.error("Ocorreu um erro ao processar a sua solicitação");
    
    this.submittingForm = false;
    
    if(error.status === 422)
      this.serverErrorMessage = JSON.parse(error._body).errors;
    else
      this.serverErrorMessage = ["Falha na comunicação com o servidor. Por favor, tente mais tarde"];
  }

  protected abstract buildResourceForm(): void;
}
