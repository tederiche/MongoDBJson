const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const app = express();
app.use(bodyParser.json());

// Adiciona esta linha para servir arquivos estáticos da pasta atual
app.use(express.static(__dirname));

async function fazerPesquisa(url, valorCid10, valorCidTipo, nomeArquivo, objetosPorArquivo = 2000) {
    const client = new MongoClient(url);

    try {
        await client.connect();

        const colecoes = ['CAT-2005', 'CAT-2006', 'CAT-2007', 'CAT-2008', 'CAT-2009', 
        'CAT-2010', 'CAT-2011', 'CAT-2012', 'CAT-2013', 'CAT-2014', 'CAT-2015', 'CAT-2016',
        'CAT-2017', 'CAT-2018', 'CAT-2019', 'CAT-2020', 'CAT-2012-NICOLAS-PLAN2', 'CAT-2013-NICOLAS-PLAN3', 'CAT-2014-NICOLAS-PLAN4',
        'CAT-2015-NICOLAS-PLAN10','CAT-2015-NICOLAS-PLAN5', 'CAT-NICOLAS-PLAN0', 'CAT-NICOLAS-PLAN11', 'CAT-NICOLAS-PLAN12', 
        'CAT-NICOLAS-PLAN13', 'CAT-NICOLAS-PLAN14', 'CAT-NICOLAS-PLAN8', 'CAT-NICOLAS-PLAN9', 'CAT-NICOLAS2017-PLAN6'];

        const resultadosPorColecao = [];

        for (const colecaoNome of colecoes) {
            const colecao = client.db().collection(colecaoNome);

            const query = {
                CID_10: valorCid10,
                CID_TIPO: valorCidTipo,
            };

            const resultado = await colecao.find(query).toArray();

            resultadosPorColecao.push({ colecao: colecaoNome, resultado });
        }

        const resultados = [].concat(...resultadosPorColecao.map(item => item.resultado));

        let parteResultados = [];
        for (let i = 0; i < resultados.length; i++) {
            parteResultados.push(resultados[i]);

            if (parteResultados.length === objetosPorArquivo || i === resultados.length - 1) {
                const parteNomeArquivo = `${nomeArquivo}_parte${Math.ceil((i + 1) / objetosPorArquivo)}.json`;
                fs.writeFileSync(parteNomeArquivo, JSON.stringify(parteResultados, null, 2));
                console.log(`Parte de resultados salvos no arquivo ${parteNomeArquivo}`);
                parteResultados = [];
            }
        }
        console.log('Resultados salvos em partes.');
        
        return resultadosPorColecao;
    } finally {
        await client.close();
    }
}

const url = 'mongodb://localhost:27017/empresaTest'; // Certifique-se de que esta variável esteja definida

app.post('/realizarPesquisa', async (req, res) => {
    const { valorCid10, valorCidTipo, nomeArquivo } = req.body;

    if (!valorCid10 || !valorCidTipo || !nomeArquivo) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    try {
        const resultados = await fazerPesquisa(url, valorCid10, valorCidTipo, nomeArquivo);
        res.json({ resultados });
    } catch (error) {
        console.error('Erro ao executar pesquisa', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
