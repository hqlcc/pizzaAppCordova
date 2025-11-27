// Variável global para armazenar a lista de pizzas
let listaPizzasCadastradas = [];
// Variável global para armazenar o ID da pizzaria (substitua pelo seu ID)
const PIZZARIA_ID = 'pizzaria_do_manus'; 
// Variável global para armazenar o ID da pizza em edição/exclusão
let pizzaEmEdicaoId = null;

// Elementos da interface
const applista = document.getElementById('applista');
const appcadastro = document.getElementById('appcadastro');
const listaPizzasDiv = document.getElementById('listaPizzas');
const btnNovo = document.getElementById('btnNovo');
const btnFoto = document.getElementById('btnFoto');
const btnSalvar = document.getElementById('btnSalvar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const imagemDiv = document.getElementById('imagem');
const inputPizza = document.getElementById('pizza');
const inputPreco = document.getElementById('preco');

// Função para alternar entre as telas
function alternarTelas(tela) {
    if (tela === 'lista') {
        applista.style.display = 'flex';
        appcadastro.style.display = 'none';
        pizzaEmEdicaoId = null; // Reseta o ID de edição ao voltar para a lista
        btnExcluir.style.display = 'none'; // Oculta o botão Excluir na lista
    } else if (tela === 'cadastro') {
        applista.style.display = 'none';
        appcadastro.style.display = 'flex';
        // Limpa os campos ao abrir a tela de cadastro para uma nova pizza
        if (pizzaEmEdicaoId === null) {
            inputPizza.value = '';
            inputPreco.value = '';
            imagemDiv.style.backgroundImage = '';
            imagemDiv.textContent = 'Clique em "Foto" para adicionar uma imagem';
            btnExcluir.style.display = 'none'; // Oculta o botão Excluir para um novo cadastro
        }
    }
}

// Função para carregar a lista de pizzas
function carregarPizzas() {
    listaPizzasDiv.innerHTML = ''; // Limpa a lista atual
    
    // GET no endpoint para buscar as pizzas
    cordova.plugin.http.get('https://backend-s0hl.onrender.com/admin/pizzas/' + PIZZARIA_ID, {}, {})
        .then(function(response) {
            // response.data é uma string JSON
            if (response.data && response.data !== '""') {
                try {
                    listaPizzasCadastradas = JSON.parse(response.data);
                } catch (e) {
                    console.error('Erro ao parsear JSON:', e);
                    listaPizzasCadastradas = [];
                }
            } else {
                listaPizzasCadastradas = [];
            }

            if (listaPizzasCadastradas.length === 0) {
                listaPizzasDiv.innerHTML = '<div class="linha">Nenhuma pizza cadastrada.</div>';
                return;
            }

            // Percorre a lista e monta a interface
            listaPizzasCadastradas.forEach((item, idx) => {
                const novo = document.createElement('div');
                novo.classList.add('linha');
                // Adiciona o nome e o preço formatado
                novo.innerHTML = `<strong>${item.pizza}</strong> - R$ ${parseFloat(item.preco).toFixed(2)}`;
                novo.id = idx;
                novo.onclick = function () {
                    carregarDadosPizza(novo.id);
                };
                
                listaPizzasDiv.appendChild(novo);
            });
        })
        .catch(function(error) {
            console.error('Erro ao carregar pizzas:', error);
            listaPizzasDiv.innerHTML = '<div class="linha">Erro ao carregar pizzas. Verifique a conexão.</div>';
        });
}

// Função para carregar os dados de uma pizza para edição
function carregarDadosPizza(id) {
    const pizza = listaPizzasCadastradas[id];
    pizzaEmEdicaoId = id; // Define o ID da pizza em edição
    
    inputPizza.value = pizza.pizza;
    inputPreco.value = pizza.preco;
    // O backend retorna a imagem como uma URL, mas o requisito usa style.backgroundImage
    // Vamos assumir que o backend retorna a URL ou o base64 no campo 'imagem'
    imagemDiv.style.backgroundImage = `url('${pizza.imagem}')`;
    imagemDiv.textContent = ''; // Remove o texto de dica
    btnExcluir.style.display = 'block'; // Exibe o botão Excluir
    
    alternarTelas('cadastro');
}

// Função para salvar (cadastrar ou editar) uma pizza
function salvarPizza() {
    const nomePizza = inputPizza.value;
    const precoPizza = inputPreco.value;
    const imagemPizza = imagemDiv.style.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/, '$1'); // Extrai a URL/base64

    if (!nomePizza || !precoPizza || !imagemPizza) {
        alert('Preencha todos os campos e adicione uma foto.');
        return;
    }

    const dados = {
        pizzaria: PIZZARIA_ID,
        pizza: nomePizza,
        preco: precoPizza,
        imagem: imagemPizza
    };

    let url = 'https://backend-s0hl.onrender.com/admin/pizza/';
    let metodo = 'post';

    if (pizzaEmEdicaoId !== null) {
        // Edição (PUT)
        // O _id da pizza deve estar no objeto da lista, que foi carregado do backend
        dados.pizzaid = listaPizzasCadastradas[pizzaEmEdicaoId]._id; 
        metodo = 'put';
    }

    cordova.plugin.http.setDataSerializer('json');
    
    const request = metodo === 'post' 
        ? cordova.plugin.http.post(url, dados, {})
        : cordova.plugin.http.put(url, dados, {});

    request.then(function(response) {
        alert('Pizza salva com sucesso!');
        carregarPizzas();
        alternarTelas('lista');
    })
    .catch(function(error) {
        console.error('Erro ao salvar pizza:', error);
        alert('Erro ao salvar pizza. Verifique o console para mais detalhes.');
    });
}

// Função para excluir uma pizza
function excluirPizza() {
    if (pizzaEmEdicaoId === null) return;

    const pizza = listaPizzasCadastradas[pizzaEmEdicaoId];
    const nomePizza = pizza.pizza;

    if (!confirm(`Tem certeza que deseja excluir a pizza "${nomePizza}"?`)) {
        return;
    }

    // O endpoint de exclusão requer o NOME_PIZZA no path
    const url = `https://backend-s0hl.onrender.com/admin/pizza/${PIZZARIA_ID}/${encodeURIComponent(nomePizza)}`;

    cordova.plugin.http.delete(url, {}, {})
        .then(function(response) {
            alert('Pizza excluída com sucesso!');
            carregarPizzas();
            alternarTelas('lista');
        })
        .catch(function(error) {
            console.error('Erro ao excluir pizza:', error);
            alert('Erro ao excluir pizza. Verifique o console para mais detalhes.');
        });
}

// Função para tirar foto (usando cordova-plugin-camera)
function tirarFoto() {
    // Verifica se o plugin da câmera está disponível
    if (!navigator.camera) {
        alert('Plugin da Câmera não disponível. Execute em um dispositivo ou emulador.');
        return;
    }

    navigator.camera.getPicture(onSuccess, onFail, {
        quality: 50,
        destinationType: Camera.DestinationType.DATA_URL, // Retorna a imagem como string Base64
        sourceType: Camera.PictureSourceType.CAMERA,
        encodingType: Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        allowEdit: true,
        correctOrientation: true
    });

    function onSuccess(imageData) {
        // A imagem é retornada como uma string base64
        const imageUrl = `url('data:image/jpeg;base64,${imageData}')`;
        imagemDiv.style.backgroundImage = imageUrl;
        imagemDiv.textContent = ''; // Remove o texto de dica
    }

    function onFail(message) {
        console.error('Falha ao tirar foto:', message);
        alert('Falha ao tirar foto: ' + message);
    }
}

// Event Listeners
btnNovo.addEventListener('click', () => alternarTelas('cadastro'));
btnCancelar.addEventListener('click', () => alternarTelas('lista'));
btnSalvar.addEventListener('click', salvarPizza);
btnExcluir.addEventListener('click', excluirPizza);
btnFoto.addEventListener('click', tirarFoto);

// Função principal do Cordova
function onDeviceReady() {
    // Incluir a instrução para serialização JSON
    cordova.plugin.http.setDataSerializer('json');
    
    // Carrega a lista de pizzas ao iniciar
    carregarPizzas();
    
    // Garante que a tela de lista é a primeira a ser exibida
    alternarTelas('lista');
}

// Inicializa o aplicativo
document.addEventListener('deviceready', onDeviceReady, false);
