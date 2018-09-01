# Server Orchestration

Instrumentacja do serwera Omodlmy Net.


## Użyte technologie

* [Ansible 2.6.2](https://docs.ansible.com/)
* [Vagrant 2.1.2](https://www.vagrantup.com/docs/index.html)
* [Virtualbox 5.2.10](https://www.virtualbox.org/wiki/Documentation)


## Użycie

### Instalacja środowiska

#### Ansible

```sh
$ sudo apt-get install software-properties-common
$ sudo apt-add-repository ppa:ansible/ansible
$ sudo apt-get update
$ sudo apt-get install ansible
```

#### Vagrant

Mimo, że Ubuntu posiada w repo vagrant'a to z mojego lepiej ściągnąć paczkę .deb
[ze strony](https://www.vagrantup.com/downloads.html)
 i zainstalować ręcznie.

 ```sh
 $ wget https://releases.hashicorp.com/vagrant/2.1.2/vagrant_2.1.2_x86_64.deb
 $ sudo dpkg -i vagrant_2.1.2_x86_64.deb

 ```

 #### VirtualBox

 ```sh
$ sudo apt-get install virtualbox
```

### Stawianie wirtualki

```sh
$ vagrant destroy -f && vagrant up --no-provision && vagrant provision --provision-with setup-virtual-env
```

### Aktualizacja wirtualki ze swoimi lokalnymi zmianami

```sh
$ vagrant provision --provision-with update-virtual-env
```
