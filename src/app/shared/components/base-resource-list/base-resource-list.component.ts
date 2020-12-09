import { OnInit, Directive } from '@angular/core';

import { BaseResourceModel } from '@shared/models/base-resource.model';
import { BaseResourceService } from '@shared/services/base-resource.service';

@Directive()
export abstract class BaseResourceListComponent<T extends BaseResourceModel> implements OnInit {

  resources: T[] = [];

  constructor(protected resourceService: BaseResourceService<T>) { }

  ngOnInit() {
    this.resourceService.getAll().subscribe(
      entries => this.resources = entries.sort((a,b) => b.id - a.id),
      error => alert("Erro ao carregar a lista")
    );
  }

  deleteResource(resource: T) {
    const mustDelete = confirm('Deseja realmente excuir este item ?');

    if (mustDelete) {
      this.resourceService.delete(resource.id).subscribe(
        () => this.resources = this.resources.filter(element => element.id != resource.id),
        error => alert("Erro ao tentar Excluir")      
      );
    }
  }

}
