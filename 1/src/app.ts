// Drag & Drop Interfaces
//interface for the item
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

//interface for the drop area
interface DragTarget {
    //check if the target is a a valid drop target
  dragOverHandler(event: DragEvent): void;
  //to react when the drop happens
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

// Project Type
enum ProjectStatus {
  Active,
  Finished
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

// Project State Management
type Listener<T> = (items: T[]) => void;

class State<T> {
  protected listeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

class ProjectState extends State<Project> {
  //listeners folositi ca sa urmaresti cand se schimba ceva stare/state
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  //metoda care adauga proiectele in array projects
  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    this.updateListeners();
  }

  moveProject(projectId: string, newStatus: ProjectStatus) {
    const project = this.projects.find(prj => prj.id === projectId);
    if (project && project.status !== newStatus) {
      project.status = newStatus;
      this.updateListeners();
    }
  }

  private updateListeners() {
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}

//An instantiation pattern in JavaScript is a way to create an object using functions.
//we instantiate a new object so we can use it in other parts of the projects --curs 9
const projectState = ProjectState.getInstance();



// autobind decorator folosit pt a schimba la ce se refera 'this'
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    }
  };
  return adjDescriptor;
}

// Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as U;
    if (newElementId) {
      this.element.id = newElementId;
    }

    this.attach(insertAtStart);
  }

  //'beforeend': Just inside the targetElement, after its last child.
  //dupa hostElement care ii div-ul cu app adauga this.element
  private attach(insertAtBeginning: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? 'afterbegin' : 'beforeend',
      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

//ProjectItem Class
//<T,U,...> sunt generic types
class ProjectItem extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable {
  private project: Project;

  get persons() {
    if (this.project.people === 1) {
      return '1 person';
    } else {
      return `${this.project.people} persons`;
    }
  }

  constructor(hostId: string, project: Project) {
    super('single-project', hostId, false, project.id);
    this.project = project;

    this.configure();
    this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent) {
    event.dataTransfer!.setData('text/plain', this.project.id);
    event.dataTransfer!.effectAllowed = 'move';
  }

  dragEndHandler(_: DragEvent) {
    console.log('DragEnd');
  }

  configure() {
    this.element.addEventListener('dragstart', this.dragStartHandler);
    this.element.addEventListener('dragend', this.dragEndHandler);
  }

  renderContent() {
    this.element.querySelector('h2')!.textContent = this.project.title;
    this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
    this.element.querySelector('p')!.textContent = this.project.description;
  }
}

// ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget {
  assignedProjects: Project[];

  //type ca in cap2 curs 15
  constructor(private type: 'active' | 'finished') {
    super('project-list', 'app', false, `${type}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
      event.preventDefault();
      const listEl = this.element.querySelector('ul')!;
      listEl.classList.add('droppable');
    }
  }

  @autobind
  dropHandler(event: DragEvent) {
    const prjId = event.dataTransfer!.getData('text/plain');
    projectState.moveProject(
      prjId,
      this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished
    );
  }

  @autobind
  dragLeaveHandler(_: DragEvent) {
    const listEl = this.element.querySelector('ul')!;
    listEl.classList.remove('droppable');
  }

  configure() {
    this.element.addEventListener('dragover', this.dragOverHandler);
    this.element.addEventListener('dragleave', this.dragLeaveHandler);
    this.element.addEventListener('drop', this.dropHandler);

    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter(prj => {
        if (this.type === 'active') {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }

  // ca sa adaugi in header
  renderContent() {
     //vrei sa adaugi id la ul din section si aici creed id respectiv
    const listId = `${this.type}-projects-list`;
    //selectezi ul si ii dai id
    this.element.querySelector('ul')!.id = listId;
    //selectezi h2 si ii dai continutul
    this.element.querySelector('h2')!.textContent =
      this.type.toUpperCase() + ' PROJECTS';
  }

  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;
    //ca sa nu adaugi ne mai multe ori acelasi element
    listEl.innerHTML = '';
    for (const prjItem of this.assignedProjects) {
      new ProjectItem(this.element.querySelector('ul')!.id, prjItem);
    }
  }
}

// ProjectInput Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super('project-input', 'app', true, 'user-input');

    //selectezi template-ul cu form
    // this.templateElemnet = document.querySelector("#project-input")!;

    // selectezi unde sa se rander-ze/afiseze elementrul
    // this.hostElement = document.querySelector("#app")!;

    //importNode() method creates a copy of a Node from another document, to be inserted into the current document later.
    //ii dai ce sa fie copiat templateElemnet.content si true pt ca vrei sa copiezi si node-urile inferioare/copiii nodului pe care il copiezi
    //creezi o copie a tot formul-lui
    // const importNode = document.importNode(this.templateElemnet.content, true);

    //aici zici ca element ia ce ai copiat in importNode, adica from-ul
    //firstElementChild read-only property returns an element's first child
    //element se refera la form pt ca am zis ca ii de tip HTMLFormElement
    // this.element = importNode.firstElementChild as HTMLFormElement;

    //adaugi id-ul asta la form
    // this.element.id = "user-input";

    //eu cred ca ii asa: ai specificat de 2 ori si sus si jos ca ii HTMLInputElement pt ca jos specifici ce iti returneaza cautare dupa id,
    //pt ca poate sa fie orice chestie cu id ala si de asta trebe sa ii specifici ce o sa returneze querySelector('#title') iar sus ai spus ca
    //ii  HTMLInputElement pt ca acolo ii initializezi si tu vrei ca ce ai initializat cu ce  primesti de la querySelector sa iti fie de acelasi tip(curs4 min 2:50)
    //selectezi campurile de la form

    this.titleInputElement = this.element.querySelector(
      '#title'
    ) as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      '#description'
    ) as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      '#people'
    ) as HTMLInputElement;
    this.configure();
  }

    //pt submit
  configure() {
    this.element.addEventListener('submit', this.submitHandler);
  }

  renderContent() {}

   //ii declarat ca tuple cap2 curs10 ca sa creeqzi un array cu un nr fix de elemente si sa stii de ce tip sunt acele elemente
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    if (
      enteredTitle.trim().length === 0 ||
      enteredDescription.trim().length === 0 ||
      enteredPeople.trim().length === 0
    ) {
      alert("Invalit input, try again");
    } else {
      //ce primesti de la .value tie ti string dar tu in tuple ai zis ca trebe sa fie nr deci trebe convertit in numar
      //daca adaugi + in fata unui sting ti-l face number
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  //pt curatare input fields
  private clearInputs() {
    this.titleInputElement.value = '';
    this.descriptionInputElement.value = '';
    this.peopleInputElement.value = '';
  }

   //ce sa faca cand faci submit
  @autobind
  private submitHandler(event: Event) {
    //sa nu iti dea refresh la pg si sa se tremita un http request
    event.preventDefault();
    //verifici daca ce ai primit de la metoda gatherUserInput ii un tuple care exita doar in ts deci daca codul se converteste in cod js, verifici daca se returneaza un array
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
       // destructuring assignment
      const [title, desc, people] = userInput;
      //tu creand projectState ai creat un array gol in care se adauga obiecte aplicand metoda addProjects()
      projectState.addProject(title, desc, people);
      this.clearInputs();
    }
  }
  
  //The insertAdjacentElement() method inserts a an element into a specified position.
  //afterbegin	After the beginning tag of the element
  //dupa hostElement care ii div-ul cu app adauga this.element
  // private attach() {
  //   this.hostElement.insertAdjacentElement("afterbegin", this.element);
  // }
}

const prjInput = new ProjectInput();
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');