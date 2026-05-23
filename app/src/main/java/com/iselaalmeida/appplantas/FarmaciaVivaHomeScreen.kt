package com.iselaalmeida.appplantas

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.outlined.MenuBook
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.Eco
import androidx.compose.material.icons.outlined.Healing
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material.icons.outlined.Science
import androidx.compose.material.icons.outlined.Spa
import androidx.compose.material.icons.outlined.Terrain
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.key
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.iselaalmeida.appplantas.ui.theme.AccentCoral
import com.iselaalmeida.appplantas.ui.theme.CardWhite
import com.iselaalmeida.appplantas.ui.theme.Cream
import com.iselaalmeida.appplantas.ui.theme.Earth
import com.iselaalmeida.appplantas.ui.theme.EarthSoft
import com.iselaalmeida.appplantas.ui.theme.Forest
import com.iselaalmeida.appplantas.ui.theme.ForestDeep
import com.iselaalmeida.appplantas.ui.theme.ForestMuted
import com.iselaalmeida.appplantas.ui.theme.HeroGreen
import com.iselaalmeida.appplantas.ui.theme.LeafBright
import com.iselaalmeida.appplantas.ui.theme.Mint
import com.iselaalmeida.appplantas.ui.theme.MintLight
import com.iselaalmeida.appplantas.ui.theme.PageBackground
import com.iselaalmeida.appplantas.ui.theme.Sage
import com.iselaalmeida.appplantas.ui.theme.SunAmber
import com.iselaalmeida.appplantas.ui.theme.SunGold
import java.text.Normalizer

private val GradienteHero = Brush.verticalGradient(
    colors = listOf(ForestDeep, Forest, LeafBright, HeroGreen)
)
private val GradienteFondo = Brush.verticalGradient(
    colors = listOf(MintLight.copy(alpha = 0.6f), PageBackground, Cream.copy(alpha = 0.4f))
)
private val GradienteChipSel = Brush.horizontalGradient(listOf(HeroGreen, LeafBright))
private val GradienteChipEspecieSel = Brush.horizontalGradient(listOf(SunAmber, SunGold))
private val GradienteDetalleTop = Brush.verticalGradient(
    colors = listOf(ForestDeep, Forest, HeroGreen)
)

private data class FilaPlanta(
    val nombre: NombreComun,
    val urlImagen: String?
)

private fun combinarNombresEImagenes(
    nombres: List<NombreComun>,
    imagenes: List<ImagenEspecie>
): List<FilaPlanta> {
    val imagenesOk = imagenes.filter { it.visibleEnApp() }
    val cantidadPorEspecie = nombres.groupingBy { it.id_especie }.eachCount()
    return nombres.map { nc ->
        val url = urlImagenParaLista(nc, imagenesOk, cantidadPorEspecie)
        FilaPlanta(nc, url)
    }
}

private fun normalizarTexto(texto: String): String =
    Normalizer.normalize(texto, Normalizer.Form.NFD)
        .replace("\\p{M}+".toRegex(), "")
        .lowercase()
        .replace("(", "")
        .replace(")", "")
        .replace(".", "")
        .replace("\\s+".toRegex(), " ")
        .trim()

@Composable
fun FarmaciaVivaHomeScreen(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    var nombresComunes by remember { mutableStateOf<List<NombreComun>>(emptyList()) }
    var imagenesEspecie by remember { mutableStateOf<List<ImagenEspecie>>(emptyList()) }
    var familias by remember { mutableStateOf<List<Familia>>(emptyList()) }
    var errorFamilias by remember { mutableStateOf<String?>(null) }
    var especieIdAFamiliaId by remember { mutableStateOf<Map<Int, Int>>(emptyMap()) }
    var errorEspeciesFiltros by remember { mutableStateOf<String?>(null) }
    var avisoMapasFiltros by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var pestaña by remember { mutableIntStateOf(0) }
    var busqueda by remember { mutableStateOf("") }
    var familiaFiltroId by remember { mutableStateOf<Int?>(null) }
    var especieFiltroId by remember { mutableStateOf<Int?>(null) }
    var catalogoEspecies by remember { mutableStateOf<List<EspecieCatalogo>>(emptyList()) }
    var mostrarPanelFiltros by remember { mutableStateOf(false) }
    var favoritosIds by remember { mutableStateOf(FavoritosStore.obtenerIds(context)) }
    var plantaDetalle by remember { mutableStateOf<FilaPlanta?>(null) }

    fun alternarFavorito(idNombreComun: Int) {
        favoritosIds = FavoritosStore.alternar(context, idNombreComun)
    }
    var detalleEspecie by remember { mutableStateOf<EspecieDetalle?>(null) }
    var detalleGenero by remember { mutableStateOf<GeneroInfo?>(null) }
    var detalleCargando by remember { mutableStateOf(false) }
    var detalleError by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(plantaDetalle?.nombre?.id_especie) {
        val fila = plantaDetalle ?: run {
            detalleEspecie = null
            detalleGenero = null
            detalleError = null
            detalleCargando = false
            return@LaunchedEffect
        }
        detalleCargando = true
        detalleError = null
        val idEspecie = fila.nombre.id_especie
        val esp = runCatching { obtenerEspecieDetalle(idEspecie) }.getOrElse { e ->
            detalleError = e.message ?: e.toString()
            detalleEspecie = null
            detalleGenero = null
            detalleCargando = false
            return@LaunchedEffect
        }
        if (plantaDetalle?.nombre?.id_especie != idEspecie) return@LaunchedEffect
        detalleEspecie = esp
        if (esp == null) {
            detalleGenero = null
            detalleError = "No se encontró la especie en la base."
        } else {
            detalleGenero = esp.id_genero?.let { gid ->
                runCatching { obtenerGeneroInfo(gid) }.getOrNull()
            }
            detalleError = null
        }
        detalleCargando = false
    }

    LaunchedEffect(Unit) {
        cargando = true
        error = null
        val nombres = runCatching { obtenerNombresComunes() }
        val imagenes = runCatching { obtenerImagenesEspecie() }
        val familiasResult = runCatching { obtenerFamilias() }
        val mapasFiltro = runCatching { obtenerMapasFiltroPlantas() }
        nombres.fold(
            onSuccess = { nombresComunes = it },
            onFailure = { error = it.message ?: "Error al cargar nombre_comun" }
        )
        imagenesEspecie = imagenes.getOrElse { emptyList() }
        familiasResult.fold(
            onSuccess = {
                familias = it.sortedBy { f -> f.nombre_familia }
                errorFamilias = null
            },
            onFailure = {
                familias = emptyList()
                errorFamilias = it.message ?: it.toString()
            }
        )
        mapasFiltro.fold(
            onSuccess = { mapas ->
                especieIdAFamiliaId = mapas.familiaPorEspecieId
                errorEspeciesFiltros = mapas.errorResumen
                avisoMapasFiltros = mapas.avisoDatos
            },
            onFailure = {
                especieIdAFamiliaId = emptyMap()
                errorEspeciesFiltros = it.message ?: it.toString()
                avisoMapasFiltros = null
            }
        )
        catalogoEspecies = runCatching { obtenerCatalogoEspecies() }.getOrElse { emptyList() }
        cargando = false
    }

    fun onFamiliaSeleccionada(id: Int?) {
        if (id != familiaFiltroId) {
            especieFiltroId?.let { espId ->
                if (id != null && especieIdAFamiliaId[espId] != id) especieFiltroId = null
            }
        }
        familiaFiltroId = id
    }

    val filas = remember(nombresComunes, imagenesEspecie) {
        combinarNombresEImagenes(nombresComunes, imagenesEspecie)
    }

    val filasFavoritas = remember(filas, favoritosIds) {
        filas.filter { it.nombre.id_nombre_comun in favoritosIds }
    }

    val etiquetaPorEspecieId = remember(catalogoEspecies, filas) {
        val mapa = catalogoEspecies.associate { it.id_especie to it.etiquetaLista() }.toMutableMap()
        filas.forEach { f ->
            if (f.nombre.id_especie !in mapa) {
                mapa[f.nombre.id_especie] = f.nombre.nombre_comun
            }
        }
        mapa
    }

    val especiesParaFiltro = remember(filas, catalogoEspecies, familiaFiltroId, especieIdAFamiliaId, etiquetaPorEspecieId) {
        val idsEnLista = filas.map { it.nombre.id_especie }.toSet()
        val base = if (catalogoEspecies.isNotEmpty()) {
            catalogoEspecies.filter { it.id_especie in idsEnLista }
        } else {
            idsEnLista.map { id ->
                EspecieCatalogo(id, nombre_cientifico = etiquetaPorEspecieId[id])
            }
        }
        (familiaFiltroId?.let { famId ->
            base.filter { especieIdAFamiliaId[it.id_especie] == famId }
        } ?: base)
            .distinctBy { it.id_especie }
            .sortedBy { it.etiquetaLista().lowercase() }
    }

    val nombreFamiliaActiva = remember(familias, familiaFiltroId) {
        familiaFiltroId?.let { id -> familias.firstOrNull { it.id_familia == id }?.nombre_familia }
    }
    val nombreEspecieActiva = remember(especieFiltroId, etiquetaPorEspecieId) {
        especieFiltroId?.let { etiquetaPorEspecieId[it] }
    }

    val termino = remember(busqueda) { normalizarTexto(busqueda) }
    val filasFiltradas = remember(filas, termino, familiaFiltroId, especieFiltroId, especieIdAFamiliaId) {
        val porTexto = if (termino.isEmpty()) {
            filas
        } else {
            filas.filter { fila ->
                val nc = fila.nombre
                normalizarTexto(nc.nombre_comun).contains(termino) ||
                    normalizarTexto(nc.idioma).contains(termino) ||
                    normalizarTexto(nc.region_uso).contains(termino) ||
                    nc.id_especie.toString().contains(termino)
            }
        }
        val porFamilia = familiaFiltroId?.let { famId ->
            porTexto.filter { especieIdAFamiliaId[it.nombre.id_especie] == famId }
        } ?: porTexto
        especieFiltroId?.let { espId ->
            porFamilia.filter { it.nombre.id_especie == espId }
        } ?: porFamilia
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(GradienteFondo)
    ) {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            containerColor = Color.Transparent,
            topBar = { EncabezadoFarmaciaViva() },
            bottomBar = {
                BarraInferiorFarmacia(
                    pestañaSeleccionada = pestaña,
                    onPestaña = { pestaña = it }
                )
            }
        ) { innerPadding ->
            when {
                cargando -> EstadoCentrado("Cargando tu jardín digital…", Modifier.padding(innerPadding))
                error != null -> EstadoCentrado("Error: $error", Modifier.padding(innerPadding))
                pestaña == 2 -> PantallaFavoritos(
                    filasFavoritas = filasFavoritas,
                    favoritosIds = favoritosIds,
                    onAbrirPlanta = { plantaDetalle = it },
                    onAlternarFavorito = ::alternarFavorito,
                    modifier = Modifier.padding(innerPadding)
                )
                else -> {
                    Column(
                        modifier = Modifier
                            .padding(innerPadding)
                            .fillMaxSize()
                    ) {
                        if (filas.isEmpty()) {
                            EstadoCentrado(
                                "No hay registros en nombre_comun ni imágenes enlazadas.",
                                Modifier.fillMaxSize()
                            )
                        } else {
                            SeccionBusqueda(
                                tituloSeccion = if (pestaña == 0) {
                                    "Explora nuestra\nbase botánica"
                                } else {
                                    "Catálogo de\nplantas"
                                },
                                totalPlantas = filas.size,
                                busqueda = busqueda,
                                onBusquedaChange = { busqueda = it },
                                hayFiltrosActivos = familiaFiltroId != null || especieFiltroId != null,
                                nombreFamiliaActiva = nombreFamiliaActiva,
                                nombreEspecieActiva = nombreEspecieActiva,
                                onAbrirFiltros = { mostrarPanelFiltros = true },
                                onLimpiarFiltros = {
                                    familiaFiltroId = null
                                    especieFiltroId = null
                                }
                            )
                            if ((familiaFiltroId != null || especieFiltroId != null) && filas.isNotEmpty()) {
                                Surface(
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                                    shape = RoundedCornerShape(20.dp),
                                    color = SunGold.copy(alpha = 0.25f),
                                    border = BorderStroke(1.dp, SunGold.copy(alpha = 0.6f))
                                ) {
                                    Text(
                                        text = "✦ ${filasFiltradas.size} de ${filas.size} plantas",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = ForestDeep,
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                                    )
                                }
                            }
                            LazyColumn(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxWidth(),
                                contentPadding = PaddingValues(
                                    start = 16.dp,
                                    end = 16.dp,
                                    top = 8.dp,
                                    bottom = 24.dp
                                ),
                                verticalArrangement = Arrangement.spacedBy(20.dp)
                            ) {
                                if (filasFiltradas.isEmpty()) {
                                    item {
                                        val msg = when {
                                            filas.isEmpty() -> ""
                                            errorEspeciesFiltros != null && familiaFiltroId != null ->
                                                "Filtros: $errorEspeciesFiltros"
                                            familiaFiltroId != null && especieIdAFamiliaId.isEmpty() ->
                                                avisoMapasFiltros
                                                    ?: "Sin enlaces especie → género → familia en la base."
                                            especieFiltroId != null || familiaFiltroId != null ->
                                                "Ningún registro coincide con el filtro elegido."
                                            termino.isNotEmpty() ->
                                                "Prueba otras palabras o borra la búsqueda."
                                            else -> ""
                                        }
                                        if (msg.isNotEmpty()) {
                                            Text(
                                                text = msg,
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = EarthSoft,
                                                textAlign = TextAlign.Center,
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(vertical = 32.dp)
                                            )
                                        }
                                    }
                                } else {
                                    items(filasFiltradas, key = { it.nombre.id_nombre_comun }) { fila ->
                                        TarjetaPlanta(
                                            fila = fila,
                                            esFavorito = fila.nombre.id_nombre_comun in favoritosIds,
                                            onToggleFavorito = { alternarFavorito(fila.nombre.id_nombre_comun) },
                                            onClick = { plantaDetalle = fila }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (mostrarPanelFiltros) {
            PanelFiltrosBottomSheet(
                onCerrar = { mostrarPanelFiltros = false },
                familias = familias,
                familiaFiltroId = familiaFiltroId,
                onFamiliaFiltro = { onFamiliaSeleccionada(it) },
                especiesParaFiltro = especiesParaFiltro,
                especieFiltroId = especieFiltroId,
                onEspecieFiltro = { especieFiltroId = it },
                errorFamilias = errorFamilias,
                errorEspeciesFiltros = errorEspeciesFiltros,
                avisoMapasFiltros = avisoMapasFiltros,
                onLimpiarTodo = {
                    familiaFiltroId = null
                    especieFiltroId = null
                }
            )
        }
        plantaDetalle?.let { fila ->
            key(fila.nombre.id_especie) {
                CapaDetallePlanta(
                    fila = fila,
                    idEspecie = fila.nombre.id_especie,
                    onCerrar = { plantaDetalle = null },
                    familias = familias,
                    detalleEspecie = detalleEspecie,
                    detalleGenero = detalleGenero,
                    detalleCargando = detalleCargando,
                    detalleError = detalleError,
                    esFavorito = fila.nombre.id_nombre_comun in favoritosIds,
                    onToggleFavorito = { alternarFavorito(fila.nombre.id_nombre_comun) }
                )
            }
        }
    }
}

@Composable
private fun GaleriaImagenesPlanta(
    idEspecie: Int,
    imagenes: List<ImagenEspecie>,
    nombrePlanta: String,
    modifier: Modifier = Modifier
) {
    val lista = imagenes
        .filter { it.id_especie == idEspecie }
        .ordenadasParaMostrar()
    var indiceSeleccionado by remember(lista) { mutableIntStateOf(0) }
    if (lista.isEmpty()) {
        Box(
            modifier = modifier
                .height(220.dp)
                .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
                .background(
                    Brush.linearGradient(colors = listOf(Mint, Sage.copy(alpha = 0.5f)))
                ),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    Icons.Outlined.Eco,
                    contentDescription = null,
                    tint = HeroGreen,
                    modifier = Modifier.size(56.dp)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Sin imagen en la base de datos",
                    style = MaterialTheme.typography.bodySmall,
                    color = EarthSoft
                )
            }
        }
        return
    }
    val indice = indiceSeleccionado.coerceIn(0, lista.lastIndex)
    val context = LocalContext.current
    Column(modifier = modifier) {
        AsyncImage(
            model = ImageRequest.Builder(context)
                .data(lista[indice].url_imagen)
                .memoryCacheKey("galeria-${lista[indice].id_imagen}")
                .diskCacheKey("galeria-${lista[indice].id_imagen}")
                .build(),
            contentDescription = nombrePlanta,
            modifier = Modifier
                .fillMaxWidth()
                .height(260.dp)
                .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp)),
            contentScale = ContentScale.Crop
        )
        if (lista.size > 1) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Foto ${indice + 1} de ${lista.size}",
                style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(alpha = 0.9f),
                modifier = Modifier.padding(horizontal = 12.dp)
            )
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                itemsIndexed(lista, key = { _, img -> img.id_imagen }) { i, img ->
                    val seleccionada = i == indice
                    AsyncImage(
                        model = ImageRequest.Builder(context)
                            .data(img.url_imagen)
                            .memoryCacheKey("thumb-${img.id_imagen}")
                            .diskCacheKey("thumb-${img.id_imagen}")
                            .build(),
                        contentDescription = "Miniatura ${i + 1}",
                        modifier = Modifier
                            .size(64.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .then(
                                if (seleccionada) {
                                    Modifier.background(SunGold, RoundedCornerShape(10.dp))
                                } else {
                                    Modifier
                                }
                            )
                            .clickable { indiceSeleccionado = i },
                        contentScale = ContentScale.Crop
                    )
                }
            }
        }
    }
}

@Composable
private fun EncabezadoFarmaciaViva() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(GradienteHero)
            .padding(bottom = 12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .shadow(8.dp, CircleShape)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(SunGold, SunAmber)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Outlined.MenuBook,
                    contentDescription = null,
                    tint = ForestDeep,
                    modifier = Modifier.size(26.dp)
                )
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column {
                Text(
                    text = "Farmacia Viva",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Black,
                        fontSize = 24.sp
                    ),
                    color = Color.White
                )
                Text(
                    text = "Medicina tradicional del territorio",
                    style = MaterialTheme.typography.bodySmall,
                    color = MintLight.copy(alpha = 0.9f)
                )
            }
        }
    }
}

@Composable
private fun BarraInferiorFarmacia(
    pestañaSeleccionada: Int,
    onPestaña: (Int) -> Unit
) {
    NavigationBar(
        containerColor = ForestDeep,
        tonalElevation = 12.dp
    ) {
        val items = listOf(
            Triple(0, Icons.Filled.Home, "Inicio"),
            Triple(1, Icons.Filled.Inventory2, "Catálogo"),
            Triple(2, Icons.Filled.FavoriteBorder, "Favoritos")
        )
        items.forEach { (idx, icon, label) ->
            val sel = pestañaSeleccionada == idx
            NavigationBarItem(
                selected = sel,
                onClick = { onPestaña(idx) },
                icon = {
                    Icon(
                        icon,
                        contentDescription = null,
                        modifier = Modifier.size(if (sel) 26.dp else 24.dp)
                    )
                },
                label = {
                    Text(
                        label,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = if (sel) FontWeight.Bold else FontWeight.Normal
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = SunGold,
                    selectedTextColor = SunGold,
                    indicatorColor = HeroGreen.copy(alpha = 0.5f),
                    unselectedIconColor = Mint.copy(alpha = 0.7f),
                    unselectedTextColor = Mint.copy(alpha = 0.7f)
                )
            )
        }
    }
}

@Composable
private fun SeccionBusqueda(
    tituloSeccion: String,
    totalPlantas: Int,
    busqueda: String,
    onBusquedaChange: (String) -> Unit,
    hayFiltrosActivos: Boolean,
    nombreFamiliaActiva: String?,
    nombreEspecieActiva: String?,
    onAbrirFiltros: () -> Unit,
    onLimpiarFiltros: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            Text(
                text = tituloSeccion,
                style = MaterialTheme.typography.displaySmall.copy(
                    fontSize = 30.sp,
                    lineHeight = 36.sp,
                    fontWeight = FontWeight.Black
                ),
                color = ForestDeep,
                modifier = Modifier.weight(1f)
            )
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = HeroGreen,
                shadowElevation = 4.dp
            ) {
                Text(
                    text = "$totalPlantas",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                )
            }
        }
        Text(
            text = "especies en catálogo",
            style = MaterialTheme.typography.labelMedium,
            color = LeafBright,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedTextField(
                value = busqueda,
                onValueChange = onBusquedaChange,
                modifier = Modifier
                    .weight(1f)
                    .shadow(6.dp, RoundedCornerShape(28.dp)),
                placeholder = {
                    Text("Buscar planta, idioma o región…", color = EarthSoft)
                },
                leadingIcon = {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(HeroGreen),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Filled.Search,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(28.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = CardWhite,
                    unfocusedContainerColor = CardWhite,
                    focusedBorderColor = HeroGreen,
                    unfocusedBorderColor = Sage,
                    cursorColor = Forest,
                    focusedTextColor = Earth,
                    unfocusedTextColor = Earth
                )
            )
            Surface(
                onClick = onAbrirFiltros,
                shape = CircleShape,
                color = if (hayFiltrosActivos) SunGold else HeroGreen,
                shadowElevation = 6.dp,
                modifier = Modifier.size(52.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Outlined.Tune,
                        contentDescription = "Filtros por familia y especie",
                        tint = if (hayFiltrosActivos) ForestDeep else Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                }
            }
        }
        if (hayFiltrosActivos) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp)
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                nombreFamiliaActiva?.let { fam ->
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = MintLight,
                        border = BorderStroke(1.dp, HeroGreen)
                    ) {
                        Text(
                            "Familia: $fam",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = ForestDeep,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                nombreEspecieActiva?.let { esp ->
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = Cream,
                        border = BorderStroke(1.dp, SunGold)
                    ) {
                        Text(
                            "Especie: $esp",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = ForestDeep,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                Surface(
                    onClick = onLimpiarFiltros,
                    shape = RoundedCornerShape(20.dp),
                    color = CardWhite,
                    border = BorderStroke(1.dp, Sage)
                ) {
                    Text(
                        "Quitar filtros",
                        style = MaterialTheme.typography.labelMedium,
                        color = EarthSoft,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PanelFiltrosBottomSheet(
    onCerrar: () -> Unit,
    familias: List<Familia>,
    familiaFiltroId: Int?,
    onFamiliaFiltro: (Int?) -> Unit,
    especiesParaFiltro: List<EspecieCatalogo>,
    especieFiltroId: Int?,
    onEspecieFiltro: (Int?) -> Unit,
    errorFamilias: String?,
    errorEspeciesFiltros: String?,
    avisoMapasFiltros: String?,
    onLimpiarTodo: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scrollFamilias = rememberScrollState()
    val scrollEspecies = rememberScrollState()

    ModalBottomSheet(
        onDismissRequest = onCerrar,
        sheetState = sheetState,
        containerColor = PageBackground
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 32.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Tune, contentDescription = null, tint = HeroGreen, modifier = Modifier.size(28.dp))
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    "Filtros",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Black,
                    color = ForestDeep,
                    modifier = Modifier.weight(1f)
                )
                Surface(
                    onClick = {
                        onLimpiarTodo()
                        onCerrar()
                    },
                    shape = RoundedCornerShape(12.dp),
                    color = MintLight
                ) {
                    Text(
                        "Limpiar",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = Forest,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }
            }
            Text(
                "Elige familia y/o especie. También puedes marcar favoritos con el corazón en cada planta.",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                modifier = Modifier.padding(top = 8.dp, bottom = 16.dp)
            )
            HorizontalDivider(color = Sage.copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                "Familia",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = ForestDeep
            )
            if (errorFamilias != null) {
                Text(
                    errorFamilias,
                    style = MaterialTheme.typography.bodySmall,
                    color = AccentCoral,
                    modifier = Modifier.padding(top = 6.dp)
                )
            } else if (familias.isEmpty()) {
                Text(
                    "No hay familias disponibles en la base.",
                    style = MaterialTheme.typography.bodySmall,
                    color = EarthSoft,
                    modifier = Modifier.padding(top = 6.dp)
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp)
                    .horizontalScroll(scrollFamilias),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ChipFamilia("Todas", familiaFiltroId == null) { onFamiliaFiltro(null) }
                familias.forEach { fam ->
                    ChipFamilia(fam.nombre_familia, familiaFiltroId == fam.id_familia) {
                        onFamiliaFiltro(fam.id_familia)
                    }
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
            Text(
                "Especie",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = ForestDeep
            )
            if (errorEspeciesFiltros != null) {
                Text(
                    errorEspeciesFiltros,
                    style = MaterialTheme.typography.bodySmall,
                    color = AccentCoral,
                    modifier = Modifier.padding(top = 6.dp)
                )
            } else if (avisoMapasFiltros != null && familiaFiltroId != null) {
                Text(
                    avisoMapasFiltros,
                    style = MaterialTheme.typography.bodySmall,
                    color = EarthSoft,
                    modifier = Modifier.padding(top = 6.dp)
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp)
                    .horizontalScroll(scrollEspecies),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ChipEspecie("Todas", especieFiltroId == null) { onEspecieFiltro(null) }
                especiesParaFiltro.forEach { esp ->
                    ChipEspecie(esp.etiquetaLista(), especieFiltroId == esp.id_especie) {
                        onEspecieFiltro(esp.id_especie)
                    }
                }
            }
            if (familiaFiltroId != null && especiesParaFiltro.isEmpty()) {
                Text(
                    "No hay especies enlazadas a esta familia en el catálogo.",
                    style = MaterialTheme.typography.bodySmall,
                    color = EarthSoft,
                    modifier = Modifier.padding(top = 10.dp)
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
            Surface(
                onClick = onCerrar,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = HeroGreen
            ) {
                Text(
                    "Aplicar filtros",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 14.dp),
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun ChipEspecie(
    texto: String,
    seleccionado: Boolean,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(24.dp)
    Box(
        modifier = Modifier
            .shadow(if (seleccionado) 6.dp else 2.dp, shape)
            .clip(shape)
            .then(
                if (seleccionado) Modifier.background(GradienteChipEspecieSel)
                else Modifier.background(CardWhite)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 10.dp)
    ) {
        Text(
            text = texto,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = if (seleccionado) FontWeight.Bold else FontWeight.Medium,
            color = if (seleccionado) ForestDeep else Forest,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun ChipFamilia(
    texto: String,
    seleccionado: Boolean,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(24.dp)
    Box(
        modifier = Modifier
            .shadow(if (seleccionado) 6.dp else 2.dp, shape)
            .clip(shape)
            .then(
                if (seleccionado) {
                    Modifier.background(GradienteChipSel)
                } else {
                    Modifier.background(CardWhite)
                }
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 10.dp)
    ) {
        Text(
            text = texto,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = if (seleccionado) FontWeight.Bold else FontWeight.Medium,
            color = if (seleccionado) Color.White else Forest,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun CapaDetallePlanta(
    fila: FilaPlanta,
    idEspecie: Int,
    onCerrar: () -> Unit,
    familias: List<Familia>,
    detalleEspecie: EspecieDetalle?,
    detalleGenero: GeneroInfo?,
    detalleCargando: Boolean,
    detalleError: String?,
    esFavorito: Boolean,
    onToggleFavorito: () -> Unit
) {
    var bibliografia by remember(idEspecie) { mutableStateOf<BibliografiaPorEspecie?>(null) }
    var bibliografiaCargando by remember(idEspecie) { mutableStateOf(true) }
    var compuestos by remember(idEspecie) { mutableStateOf<CompuestosPorEspecie?>(null) }
    var compuestosCargando by remember(idEspecie) { mutableStateOf(true) }
    var ubicaciones by remember(idEspecie) { mutableStateOf<UbicacionesPorEspecie?>(null) }
    var ubicacionesCargando by remember(idEspecie) { mutableStateOf(true) }
    var ubicacionesError by remember(idEspecie) { mutableStateOf<String?>(null) }
    var habitats by remember(idEspecie) { mutableStateOf<HabitatsPorEspecie?>(null) }
    var habitatsCargando by remember(idEspecie) { mutableStateOf(true) }
    var habitatsError by remember(idEspecie) { mutableStateOf<String?>(null) }
    var propiedades by remember(idEspecie) { mutableStateOf<PropiedadesPorEspecie?>(null) }
    var propiedadesCargando by remember(idEspecie) { mutableStateOf(true) }
    var propiedadesError by remember(idEspecie) { mutableStateOf<String?>(null) }
    var usos by remember(idEspecie) { mutableStateOf<UsosPorEspecie?>(null) }
    var usosCargando by remember(idEspecie) { mutableStateOf(true) }
    var usosError by remember(idEspecie) { mutableStateOf<String?>(null) }
    var compuestosError by remember(idEspecie) { mutableStateOf<String?>(null) }
    var bibliografiaError by remember(idEspecie) { mutableStateOf<String?>(null) }
    var imagenesPlanta by remember(idEspecie) { mutableStateOf<List<ImagenEspecie>>(emptyList()) }

    LaunchedEffect(idEspecie) {
        imagenesPlanta = runCatching { obtenerImagenesPorEspecie(idEspecie) }.getOrElse { emptyList() }
    }

    LaunchedEffect(idEspecie) {
        val especieSolicitada = idEspecie
        bibliografia = null
        bibliografiaError = null
        bibliografiaCargando = true
        compuestos = null
        compuestosError = null
        compuestosCargando = true
        ubicaciones = null
        ubicacionesError = null
        ubicacionesCargando = true
        habitats = null
        habitatsError = null
        habitatsCargando = true
        propiedades = null
        propiedadesError = null
        propiedadesCargando = true
        usos = null
        usosError = null
        usosCargando = true

        coroutineScope {
            val bib = async {
                runCatching { obtenerBibliografiaPorEspecie(especieSolicitada) }
            }
            val comp = async {
                runCatching { obtenerCompuestosPorEspecie(especieSolicitada) }
            }
            val ubi = async {
                runCatching { obtenerUbicacionesPorEspecie(especieSolicitada) }
            }
            val hab = async {
                runCatching { obtenerHabitatsPorEspecie(especieSolicitada) }
            }
            val prop = async {
                runCatching { obtenerPropiedadesPorEspecie(especieSolicitada) }
            }
            val uso = async {
                runCatching { obtenerUsosPorEspecie(especieSolicitada) }
            }

            bib.await().fold(
                onSuccess = {
                    bibliografia = it.aplicarSiEspecieActiva(especieSolicitada, idEspecie)
                    bibliografiaError = null
                },
                onFailure = {
                    if (especieSolicitada == idEspecie) {
                        bibliografia = null
                        bibliografiaError = it.message ?: "Error al cargar bibliografía"
                    }
                }
            )
            if (especieSolicitada == idEspecie) bibliografiaCargando = false

            comp.await().fold(
                onSuccess = {
                    compuestos = it.aplicarSiEspecieActiva(especieSolicitada, idEspecie)
                    compuestosError = null
                },
                onFailure = {
                    if (especieSolicitada == idEspecie) {
                        compuestos = null
                        compuestosError = it.message ?: "Error al cargar compuestos"
                    }
                }
            )
            if (especieSolicitada == idEspecie) compuestosCargando = false

            ubi.await().fold(
                onSuccess = {
                    ubicaciones = it.aplicarSiEspecieActiva(especieSolicitada, idEspecie)
                    ubicacionesError = null
                },
                onFailure = {
                    if (especieSolicitada == idEspecie) {
                        ubicaciones = null
                        ubicacionesError = it.message ?: "Error al cargar ubicación"
                    }
                }
            )
            if (especieSolicitada == idEspecie) ubicacionesCargando = false

            hab.await().fold(
                onSuccess = {
                    habitats = it.aplicarSiEspecieActiva(especieSolicitada, idEspecie)
                    habitatsError = null
                },
                onFailure = {
                    if (especieSolicitada == idEspecie) {
                        habitats = null
                        habitatsError = it.message ?: "Error al cargar hábitat"
                    }
                }
            )
            if (especieSolicitada == idEspecie) habitatsCargando = false

            prop.await().fold(
                onSuccess = {
                    propiedades = it.aplicarSiEspecieActiva(especieSolicitada, idEspecie)
                    propiedadesError = null
                },
                onFailure = {
                    if (especieSolicitada == idEspecie) {
                        propiedades = null
                        propiedadesError = it.message ?: "Error al cargar propiedades"
                    }
                }
            )
            if (especieSolicitada == idEspecie) propiedadesCargando = false

            uso.await().fold(
                onSuccess = {
                    usos = it.aplicarSiEspecieActiva(especieSolicitada, idEspecie)
                    usosError = null
                },
                onFailure = {
                    if (especieSolicitada == idEspecie) {
                        usos = null
                        usosError = it.message ?: "Error al cargar usos"
                    }
                }
            )
            if (especieSolicitada == idEspecie) usosCargando = false
        }
    }

    BackHandler(onBack = onCerrar)
    val scroll = rememberScrollState()
    val nombreFamilia = detalleGenero?.id_familia?.let { fid ->
        familias.firstOrNull { it.id_familia == fid }?.nombre_familia
    }
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = PageBackground
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scroll)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(GradienteDetalleTop)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp, horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onCerrar) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Cerrar",
                            tint = Color.White
                        )
                    }
                    Text(
                        text = "Ficha de la planta",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(onClick = onToggleFavorito) {
                        Icon(
                            imageVector = if (esFavorito) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                            contentDescription = if (esFavorito) "Quitar de favoritos" else "Añadir a favoritos",
                            tint = if (esFavorito) AccentCoral else Color.White
                        )
                    }
                }
                GaleriaImagenesPlanta(
                    idEspecie = idEspecie,
                    imagenes = imagenesPlanta,
                    nombrePlanta = fila.nombre.nombre_comun,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 56.dp)
                )
            }
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-20).dp)
                    .padding(horizontal = 20.dp)
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = CardWhite),
                    elevation = CardDefaults.cardElevation(10.dp)
                ) {
                    Column(modifier = Modifier.padding(22.dp)) {
                        Text(
                            text = fila.nombre.nombre_comun,
                            style = MaterialTheme.typography.headlineMedium,
                            fontStyle = FontStyle.Italic,
                            fontWeight = FontWeight.Black,
                            color = ForestDeep
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            BadgeInfo("Idioma", fila.nombre.idioma)
                            BadgeInfo("Región", fila.nombre.region_uso)
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MintLight),
                    border = BorderStroke(1.dp, Sage)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text(
                            "Taxonomía",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = ForestDeep
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        DetalleLinea("Familia", nombreFamilia ?: "—")
                        DetalleLinea("Género", detalleGenero?.nombre_genero ?: "—")
                    }
                }
                if (detalleCargando) {
                    Text(
                        "Cargando ficha botánica…",
                        color = EarthSoft,
                        modifier = Modifier.padding(top = 16.dp)
                    )
                }
                detalleError?.let {
                    Text(it, color = AccentCoral, modifier = Modifier.padding(top = 8.dp))
                }
                detalleEspecie?.let { e ->
                    Spacer(modifier = Modifier.height(16.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite),
                        elevation = CardDefaults.cardElevation(4.dp)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text(
                                "Ficha botánica",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = HeroGreen
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            DetalleLineaOpcional("Nombre científico", e.nombre_cientifico)
                            DetalleLineaOpcional("Autor taxonómico", e.autor_taxonomico)
                            DetalleLineaOpcional("Epíteto específico", e.epiteto_especifico)
                            DetalleLineaOpcional("Descripción", e.descripcion_botanica)
                            DetalleLineaOpcional("Ciclo de vida", e.ciclo_vida)
                            DetalleLineaOpcional("Tipo", e.tipo_planta)
                            DetalleLineaOpcional("Conservación", e.estatus_conservacion)
                            DetalleLineaOpcional("Origen", e.origen_geografico)
                            e.es_endemica?.let { end ->
                                DetalleLinea("Endémica", if (end) "Sí" else "No")
                            }
                            DetalleLineaOpcional("Observaciones", e.observaciones)
                        }
                    }
                }
                SeccionUbicacion(
                    idEspecie = idEspecie,
                    ubicaciones = ubicaciones,
                    cargando = ubicacionesCargando,
                    error = ubicacionesError
                )
                SeccionHabitat(
                    habitats = habitats,
                    cargando = habitatsCargando,
                    error = habitatsError
                )
                SeccionPropiedades(
                    propiedades = propiedades,
                    cargando = propiedadesCargando,
                    error = propiedadesError
                )
                SeccionUsos(
                    idEspecie = idEspecie,
                    usos = usos,
                    cargando = usosCargando,
                    error = usosError
                )
                SeccionCompuestos(
                    compuestos = compuestos,
                    cargando = compuestosCargando,
                    error = compuestosError
                )
                SeccionBibliografia(
                    idEspecie = idEspecie,
                    bibliografia = bibliografia,
                    cargando = bibliografiaCargando,
                    error = bibliografiaError
                )
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

private const val MAX_REGISTROS_FICHA = 5

private fun <T> List<T>.limitarFicha(mostrarTodos: Boolean): List<T> =
    if (mostrarTodos || size <= MAX_REGISTROS_FICHA) this else take(MAX_REGISTROS_FICHA)

@Composable
private fun BotonVerMasRegistros(
    ocultos: Int,
    mostrarTodos: Boolean,
    onToggle: () -> Unit
) {
    if (ocultos <= 0) return
    Spacer(modifier = Modifier.height(10.dp))
    Text(
        text = if (mostrarTodos) "Ver menos" else "Ver $ocultos más",
        style = MaterialTheme.typography.labelMedium,
        fontWeight = FontWeight.SemiBold,
        color = HeroGreen,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggle)
            .padding(vertical = 4.dp)
    )
}

@Composable
private fun SeccionUbicacion(
    idEspecie: Int,
    ubicaciones: UbicacionesPorEspecie?,
    cargando: Boolean,
    error: String? = null
) {
    val datos = ubicaciones?.takeIf { it.idEspecie == idEspecie }
    var expandida by remember(idEspecie) { mutableStateOf(false) }
    var verTodos by remember(idEspecie) { mutableStateOf(false) }
    Spacer(modifier = Modifier.height(16.dp))
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Cream),
        border = BorderStroke(1.dp, Sage.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = !cargando && error == null && datos != null && datos.grupos.isNotEmpty()) {
                        expandida = !expandida
                    },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Outlined.Place,
                    contentDescription = null,
                    tint = Earth,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Ubicación en esta planta",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    when {
                        cargando -> Text(
                            "Cargando…",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        error != null -> Text(
                            "No se pudo cargar: $error",
                            style = MaterialTheme.typography.bodySmall,
                            color = AccentCoral
                        )
                        datos == null || datos.grupos.isEmpty() -> Text(
                            "Sin reportes de ubicación para esta planta",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        else -> {
                            val extra = if (datos.grupos.size > MAX_REGISTROS_FICHA) {
                                " · primeras $MAX_REGISTROS_FICHA al abrir"
                            } else ""
                            Text(
                                "${datos.totalReportes} reporte(s) en esta ficha$extra",
                                style = MaterialTheme.typography.bodySmall,
                                color = LeafBright
                            )
                        }
                    }
                }
                if (!cargando && error == null && datos != null && datos.grupos.isNotEmpty()) {
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = if (expandida) "Ocultar ubicación" else "Ver ubicación",
                        tint = Forest,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
            if (!cargando && error == null && datos != null && datos.grupos.isNotEmpty() && expandida) {
                Spacer(modifier = Modifier.height(14.dp))
                HorizontalDivider(color = Sage.copy(alpha = 0.45f))
                Spacer(modifier = Modifier.height(14.dp))
                val gruposVisibles = datos.grupos.limitarFicha(verTodos)
                gruposVisibles.forEachIndexed { indexGrupo, grupo ->
                    if (indexGrupo > 0) {
                        Spacer(modifier = Modifier.height(14.dp))
                    }
                    key(grupo.idUbicacion) {
                        BloqueGrupoUbicacion(
                            numeroGrupo = indexGrupo + 1,
                            grupo = grupo
                        )
                    }
                }
                BotonVerMasRegistros(
                    ocultos = datos.grupos.size - gruposVisibles.size,
                    mostrarTodos = verTodos,
                    onToggle = { verTodos = !verTodos }
                )
            }
        }
    }
}

@Composable
private fun BloqueGrupoUbicacion(
    numeroGrupo: Int,
    grupo: GrupoUbicacionEnPlanta
) {
    var fichaCatalogoAbierta by remember(grupo.idUbicacion) { mutableStateOf(false) }
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = CardWhite,
        border = BorderStroke(1.dp, Sage.copy(alpha = 0.55f))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Surface(
                    shape = CircleShape,
                    color = Earth,
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            "$numeroGrupo",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        grupo.titulo,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    Text(
                        "Reportes en esta planta",
                        style = MaterialTheme.typography.labelSmall,
                        color = HeroGreen,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            grupo.reportes.forEachIndexed { indexReporte, registro ->
                if (indexReporte > 0) {
                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider(color = Sage.copy(alpha = 0.35f))
                    Spacer(modifier = Modifier.height(10.dp))
                }
                BloqueReporteUbicacionEnPlanta(
                    numeroReporte = indexReporte + 1,
                    totalReportes = grupo.reportes.size,
                    vinculo = registro.vinculo
                )
            }
            grupo.catalogo?.takeIf { it.tieneFichaCatalogo() }?.let { cat ->
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Sage.copy(alpha = 0.35f))
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    "Datos del lugar (catálogo)",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = EarthSoft,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { fichaCatalogoAbierta = !fichaCatalogoAbierta }
                        .padding(vertical = 2.dp)
                )
                if (fichaCatalogoAbierta) {
                    Spacer(modifier = Modifier.height(6.dp))
                    cat.latitud?.trim()?.takeIf { it.isNotEmpty() }?.let { lat ->
                        Text(
                            "Latitud: $lat",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                    }
                    cat.longitud?.trim()?.takeIf { it.isNotEmpty() }?.let { lon ->
                        Text(
                            "Longitud: $lon",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                    cat.region_biogeografica?.trim()?.takeIf { it.isNotEmpty() }?.let { region ->
                        Text(
                            "Región biogeográfica: $region",
                            style = MaterialTheme.typography.bodySmall,
                            color = Forest,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                } else {
                    Text(
                        "Toca para ver coordenadas y región biogeográfica",
                        style = MaterialTheme.typography.bodySmall,
                        color = EarthSoft,
                        fontStyle = FontStyle.Italic,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun BloqueReporteUbicacionEnPlanta(
    numeroReporte: Int,
    totalReportes: Int,
    vinculo: EspecieUbicacion
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        if (totalReportes > 1) {
            Text(
                "Reporte $numeroReporte",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                color = LeafBright
            )
            Spacer(modifier = Modifier.height(4.dp))
        }
        vinculo.es_nativa?.let { nativa ->
            Text(
                "Nativa en esta zona: ${if (nativa) "Sí" else "No"}",
                style = MaterialTheme.typography.bodySmall,
                color = ForestDeep
            )
        }
        vinculo.es_cultivada?.let { cultivada ->
            Text(
                "Cultivada: ${if (cultivada) "Sí" else "No"}",
                style = MaterialTheme.typography.bodySmall,
                color = ForestDeep,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        vinculo.abundancia?.trim()?.takeIf { it.isNotEmpty() }?.let { abun ->
            Text(
                "Abundancia: $abun",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        vinculo.observaciones?.trim()?.takeIf { it.isNotEmpty() }?.let { obs ->
            Text(
                obs,
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        val vacio = vinculo.es_nativa == null && vinculo.es_cultivada == null &&
            vinculo.abundancia.isNullOrBlank() && vinculo.observaciones.isNullOrBlank()
        if (vacio) {
            Text(
                "Sin datos de presencia en este registro",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                fontStyle = FontStyle.Italic
            )
        }
    }
}

@Composable
private fun SeccionHabitat(
    habitats: HabitatsPorEspecie?,
    cargando: Boolean,
    error: String? = null
) {
    val especieKey = habitats?.idEspecie ?: 0
    var expandida by remember { mutableStateOf(false) }
    var verTodos by remember(especieKey) { mutableStateOf(false) }
    Spacer(modifier = Modifier.height(16.dp))
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Cream),
        border = BorderStroke(1.dp, EarthSoft.copy(alpha = 0.4f))
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = !cargando && error == null && habitats != null && habitats.grupos.isNotEmpty()) {
                        expandida = !expandida
                    },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Outlined.Terrain,
                    contentDescription = null,
                    tint = Forest,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Hábitat en esta planta",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    when {
                        cargando -> Text(
                            "Cargando…",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        error != null -> Text(
                            "No se pudo cargar: $error",
                            style = MaterialTheme.typography.bodySmall,
                            color = AccentCoral
                        )
                        habitats == null || habitats.grupos.isEmpty() -> Text(
                            "Sin reportes de hábitat para esta planta",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        else -> Text(
                            "${habitats.totalReportes} reporte(s) en esta ficha",
                            style = MaterialTheme.typography.bodySmall,
                            color = LeafBright
                        )
                    }
                }
                if (!cargando && error == null && habitats != null && habitats.grupos.isNotEmpty()) {
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = if (expandida) "Ocultar hábitat" else "Ver hábitat",
                        tint = Forest,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
            if (!cargando && error == null && habitats != null && habitats.grupos.isNotEmpty() && expandida) {
                Spacer(modifier = Modifier.height(14.dp))
                HorizontalDivider(color = Sage.copy(alpha = 0.45f))
                Spacer(modifier = Modifier.height(14.dp))
                val gruposVisibles = habitats.grupos.limitarFicha(verTodos)
                gruposVisibles.forEachIndexed { indexGrupo, grupo ->
                    if (indexGrupo > 0) {
                        Spacer(modifier = Modifier.height(14.dp))
                    }
                    key(grupo.idHabitat) {
                        BloqueGrupoHabitat(
                            numeroGrupo = indexGrupo + 1,
                            grupo = grupo
                        )
                    }
                }
                BotonVerMasRegistros(
                    ocultos = habitats.grupos.size - gruposVisibles.size,
                    mostrarTodos = verTodos,
                    onToggle = { verTodos = !verTodos }
                )
            }
        }
    }
}

@Composable
private fun BloqueGrupoHabitat(
    numeroGrupo: Int,
    grupo: GrupoHabitatEnPlanta
) {
    var fichaCatalogoAbierta by remember(grupo.idHabitat) { mutableStateOf(false) }
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = CardWhite,
        border = BorderStroke(1.dp, Sage.copy(alpha = 0.55f))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Surface(
                    shape = CircleShape,
                    color = Forest,
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            "$numeroGrupo",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        grupo.titulo,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    Text(
                        "Reportes en esta planta",
                        style = MaterialTheme.typography.labelSmall,
                        color = HeroGreen,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            grupo.reportes.forEachIndexed { indexReporte, registro ->
                if (indexReporte > 0) {
                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider(color = Sage.copy(alpha = 0.35f))
                    Spacer(modifier = Modifier.height(10.dp))
                }
                BloqueReporteHabitatEnPlanta(
                    numeroReporte = indexReporte + 1,
                    totalReportes = grupo.reportes.size,
                    vinculo = registro.vinculo
                )
            }
            grupo.catalogo?.takeIf { it.tieneFichaCatalogo() }?.let { cat ->
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Sage.copy(alpha = 0.35f))
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    "Ficha del hábitat (catálogo)",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = EarthSoft,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { fichaCatalogoAbierta = !fichaCatalogoAbierta }
                        .padding(vertical = 2.dp)
                )
                if (fichaCatalogoAbierta) {
                    Spacer(modifier = Modifier.height(6.dp))
                    cat.clima?.trim()?.takeIf { it.isNotEmpty() }?.let { clima ->
                        Text(
                            "Clima: $clima",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                    }
                    cat.tipo_suelo?.trim()?.takeIf { it.isNotEmpty() }?.let { suelo ->
                        Text(
                            "Suelo: $suelo",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                    cat.lineaAltitud()?.let { alt ->
                        Text(
                            "Altitud: $alt",
                            style = MaterialTheme.typography.bodySmall,
                            color = Forest,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                    cat.descripcion?.trim()?.takeIf { it.isNotEmpty() }?.let { desc ->
                        Text(
                            desc,
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                } else {
                    Text(
                        "Toca para ver clima, suelo, altitud y descripción",
                        style = MaterialTheme.typography.bodySmall,
                        color = EarthSoft,
                        fontStyle = FontStyle.Italic,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun BloqueReporteHabitatEnPlanta(
    numeroReporte: Int,
    totalReportes: Int,
    vinculo: EspecieHabitat
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        if (totalReportes > 1) {
            Text(
                "Reporte $numeroReporte",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                color = LeafBright
            )
            Spacer(modifier = Modifier.height(4.dp))
        }
        vinculo.frecuencia_presencia?.trim()?.takeIf { it.isNotEmpty() }?.let { freq ->
            Text(
                "Frecuencia: $freq",
                style = MaterialTheme.typography.bodySmall,
                color = ForestDeep
            )
        }
        vinculo.observaciones?.trim()?.takeIf { it.isNotEmpty() }?.let { obs ->
            Text(
                obs,
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        if (vinculo.frecuencia_presencia.isNullOrBlank() && vinculo.observaciones.isNullOrBlank()) {
            Text(
                "Sin frecuencia ni observaciones en este registro",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                fontStyle = FontStyle.Italic
            )
        }
    }
}

@Composable
private fun SeccionPropiedades(
    propiedades: PropiedadesPorEspecie?,
    cargando: Boolean,
    error: String? = null
) {
    val especieKey = propiedades?.idEspecie ?: 0
    var expandida by remember { mutableStateOf(false) }
    var verTodos by remember(especieKey) { mutableStateOf(false) }
    Spacer(modifier = Modifier.height(16.dp))
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Cream),
        border = BorderStroke(1.dp, SunGold.copy(alpha = 0.45f))
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = !cargando && error == null && propiedades != null && propiedades.grupos.isNotEmpty()) {
                        expandida = !expandida
                    },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Outlined.Spa,
                    contentDescription = null,
                    tint = SunAmber,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Propiedades en esta planta",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    when {
                        cargando -> Text(
                            "Cargando…",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        error != null -> Text(
                            "No se pudo cargar: $error",
                            style = MaterialTheme.typography.bodySmall,
                            color = AccentCoral
                        )
                        propiedades == null || propiedades.grupos.isEmpty() -> Text(
                            "Sin reportes de propiedades para esta planta",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        else -> Text(
                            "${propiedades.totalReportes} reporte(s) en esta ficha",
                            style = MaterialTheme.typography.bodySmall,
                            color = LeafBright
                        )
                    }
                }
                if (!cargando && error == null && propiedades != null && propiedades.grupos.isNotEmpty()) {
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = if (expandida) "Ocultar propiedades" else "Ver propiedades",
                        tint = Forest,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
            if (!cargando && error == null && propiedades != null && propiedades.grupos.isNotEmpty() && expandida) {
                Spacer(modifier = Modifier.height(14.dp))
                HorizontalDivider(color = Sage.copy(alpha = 0.45f))
                Spacer(modifier = Modifier.height(14.dp))
                val gruposVisibles = propiedades.grupos.limitarFicha(verTodos)
                gruposVisibles.forEachIndexed { indexGrupo, grupo ->
                    if (indexGrupo > 0) {
                        Spacer(modifier = Modifier.height(14.dp))
                    }
                    key(grupo.idPropiedad) {
                        BloqueGrupoPropiedad(
                            numeroGrupo = indexGrupo + 1,
                            grupo = grupo
                        )
                    }
                }
                BotonVerMasRegistros(
                    ocultos = propiedades.grupos.size - gruposVisibles.size,
                    mostrarTodos = verTodos,
                    onToggle = { verTodos = !verTodos }
                )
            }
        }
    }
}

@Composable
private fun BloqueGrupoPropiedad(
    numeroGrupo: Int,
    grupo: GrupoPropiedadEnPlanta
) {
    var fichaCatalogoAbierta by remember(grupo.idPropiedad) { mutableStateOf(false) }
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = CardWhite,
        border = BorderStroke(1.dp, Sage.copy(alpha = 0.55f))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Surface(
                    shape = CircleShape,
                    color = SunAmber,
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            "$numeroGrupo",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        grupo.titulo,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    Text(
                        "Reportes en esta planta",
                        style = MaterialTheme.typography.labelSmall,
                        color = HeroGreen,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            grupo.reportes.forEachIndexed { indexReporte, registro ->
                if (indexReporte > 0) {
                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider(color = Sage.copy(alpha = 0.35f))
                    Spacer(modifier = Modifier.height(10.dp))
                }
                BloqueReportePropiedadEnPlanta(
                    numeroReporte = indexReporte + 1,
                    totalReportes = grupo.reportes.size,
                    vinculo = registro.vinculo
                )
            }
            grupo.catalogo?.takeIf { it.tieneFichaCatalogo() }?.let { cat ->
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Sage.copy(alpha = 0.35f))
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    "Ficha de la propiedad (catálogo)",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = EarthSoft,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { fichaCatalogoAbierta = !fichaCatalogoAbierta }
                        .padding(vertical = 2.dp)
                )
                if (fichaCatalogoAbierta) {
                    Spacer(modifier = Modifier.height(6.dp))
                    cat.descripcion?.trim()?.takeIf { it.isNotEmpty() }?.let { desc ->
                        Text(
                            desc,
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                    }
                } else {
                    Text(
                        "Toca para ver la descripción de la propiedad",
                        style = MaterialTheme.typography.bodySmall,
                        color = EarthSoft,
                        fontStyle = FontStyle.Italic,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun BloqueReportePropiedadEnPlanta(
    numeroReporte: Int,
    totalReportes: Int,
    vinculo: EspeciePropiedad
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        if (totalReportes > 1) {
            Text(
                "Reporte $numeroReporte",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                color = LeafBright
            )
            Spacer(modifier = Modifier.height(4.dp))
        }
        vinculo.nivel_evidencia?.trim()?.takeIf { it.isNotEmpty() }?.let { nivel ->
            Text(
                "Nivel de evidencia: $nivel",
                style = MaterialTheme.typography.bodySmall,
                color = ForestDeep
            )
        }
        vinculo.observaciones?.trim()?.takeIf { it.isNotEmpty() }?.let { obs ->
            Text(
                obs,
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        if (vinculo.nivel_evidencia.isNullOrBlank() && vinculo.observaciones.isNullOrBlank()) {
            Text(
                "Sin nivel de evidencia ni observaciones en este registro",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                fontStyle = FontStyle.Italic
            )
        }
    }
}

@Composable
private fun SeccionUsos(
    idEspecie: Int,
    usos: UsosPorEspecie?,
    cargando: Boolean,
    error: String? = null
) {
    val datos = usos?.takeIf { it.idEspecie == idEspecie }
    var expandida by remember(idEspecie) { mutableStateOf(false) }
    var verTodos by remember(idEspecie) { mutableStateOf(false) }
    Spacer(modifier = Modifier.height(16.dp))
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Cream),
        border = BorderStroke(1.dp, HeroGreen.copy(alpha = 0.35f))
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = !cargando && error == null && datos != null && datos.grupos.isNotEmpty()) {
                        expandida = !expandida
                    },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Outlined.Healing,
                    contentDescription = null,
                    tint = HeroGreen,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Usos en esta planta",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    when {
                        cargando -> Text(
                            "Cargando…",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        error != null -> Text(
                            "No se pudo cargar: $error",
                            style = MaterialTheme.typography.bodySmall,
                            color = AccentCoral
                        )
                        datos == null || datos.grupos.isEmpty() -> Text(
                            "Sin usos registrados para esta planta",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        else -> {
                            val extra = if (datos.grupos.size > MAX_REGISTROS_FICHA) {
                                " · primeras $MAX_REGISTROS_FICHA al abrir"
                            } else ""
                            Text(
                                "${datos.totalUsos} uso(s) en esta ficha$extra",
                                style = MaterialTheme.typography.bodySmall,
                                color = LeafBright
                            )
                        }
                    }
                }
                if (!cargando && error == null && datos != null && datos.grupos.isNotEmpty()) {
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = if (expandida) "Ocultar usos" else "Ver usos",
                        tint = Forest,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
            if (!cargando && error == null && datos != null && datos.grupos.isNotEmpty() && expandida) {
                Spacer(modifier = Modifier.height(14.dp))
                HorizontalDivider(color = Sage.copy(alpha = 0.45f))
                Spacer(modifier = Modifier.height(14.dp))
                val gruposVisibles = datos.grupos.limitarFicha(verTodos)
                gruposVisibles.forEachIndexed { indexGrupo, grupo ->
                    if (indexGrupo > 0) {
                        Spacer(modifier = Modifier.height(14.dp))
                    }
                    key(grupo.idCategoria) {
                        BloqueGrupoUso(
                            numeroGrupo = indexGrupo + 1,
                            grupo = grupo
                        )
                    }
                }
                BotonVerMasRegistros(
                    ocultos = datos.grupos.size - gruposVisibles.size,
                    mostrarTodos = verTodos,
                    onToggle = { verTodos = !verTodos }
                )
            }
        }
    }
}

@Composable
private fun BloqueGrupoUso(
    numeroGrupo: Int,
    grupo: GrupoUsoEnPlanta
) {
    var fichaCategoriaAbierta by remember(grupo.idCategoria) { mutableStateOf(false) }
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = CardWhite,
        border = BorderStroke(1.dp, Sage.copy(alpha = 0.55f))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Surface(
                    shape = CircleShape,
                    color = HeroGreen,
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            "$numeroGrupo",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        grupo.titulo,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    Text(
                        "Detalle del uso",
                        style = MaterialTheme.typography.labelSmall,
                        color = HeroGreen,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            grupo.usos.forEachIndexed { indexUso, uso ->
                if (indexUso > 0) {
                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider(color = Sage.copy(alpha = 0.35f))
                    Spacer(modifier = Modifier.height(10.dp))
                }
                BloqueDetalleUso(
                    numeroUso = indexUso + 1,
                    totalUsos = grupo.usos.size,
                    uso = uso
                )
            }
            grupo.categoria?.takeIf { it.tieneFichaCatalogo() }?.let { cat ->
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Sage.copy(alpha = 0.35f))
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    "Categoría (catálogo)",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = EarthSoft,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { fichaCategoriaAbierta = !fichaCategoriaAbierta }
                        .padding(vertical = 2.dp)
                )
                if (fichaCategoriaAbierta) {
                    Spacer(modifier = Modifier.height(6.dp))
                    cat.descripcion?.trim()?.takeIf { it.isNotEmpty() }?.let { desc ->
                        Text(
                            desc,
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                    }
                } else {
                    Text(
                        "Toca para ver la descripción de la categoría",
                        style = MaterialTheme.typography.bodySmall,
                        color = EarthSoft,
                        fontStyle = FontStyle.Italic,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun BloqueDetalleUso(
    numeroUso: Int,
    totalUsos: Int,
    uso: UsoPlanta
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        if (totalUsos > 1) {
            Text(
                "Registro $numeroUso",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                color = LeafBright
            )
            Spacer(modifier = Modifier.height(4.dp))
        }
        uso.descripcion_uso?.trim()?.takeIf { it.isNotEmpty() }?.let { desc ->
            Text(
                desc,
                style = MaterialTheme.typography.bodySmall,
                color = ForestDeep
            )
        }
        uso.parte_utilizada?.trim()?.takeIf { it.isNotEmpty() }?.let { parte ->
            Text(
                "Parte utilizada: $parte",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        uso.forma_preparacion?.trim()?.takeIf { it.isNotEmpty() }?.let { prep ->
            Text(
                "Preparación: $prep",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        uso.via_administracion?.trim()?.takeIf { it.isNotEmpty() }?.let { via ->
            Text(
                "Vía: $via",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        uso.frecuencia_uso?.trim()?.takeIf { it.isNotEmpty() }?.let { freq ->
            Text(
                "Frecuencia: $freq",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        uso.riesgos_contraindicaciones?.trim()?.takeIf { it.isNotEmpty() }?.let { riesgo ->
            Text(
                "Riesgos / contraindicaciones: $riesgo",
                style = MaterialTheme.typography.bodySmall,
                color = AccentCoral,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        val vacio = listOf(
            uso.descripcion_uso,
            uso.parte_utilizada,
            uso.forma_preparacion,
            uso.via_administracion,
            uso.frecuencia_uso,
            uso.riesgos_contraindicaciones
        ).all { it.isNullOrBlank() }
        if (vacio) {
            Text(
                "Sin detalle en este registro",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                fontStyle = FontStyle.Italic
            )
        }
    }
}

@Composable
private fun SeccionCompuestos(
    compuestos: CompuestosPorEspecie?,
    cargando: Boolean,
    error: String? = null
) {
    val especieKey = compuestos?.idEspecie ?: 0
    var expandida by remember { mutableStateOf(false) }
    var verTodos by remember(especieKey) { mutableStateOf(false) }
    Spacer(modifier = Modifier.height(16.dp))
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Cream),
        border = BorderStroke(1.dp, LeafBright.copy(alpha = 0.35f))
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = !cargando && error == null && compuestos != null && compuestos.grupos.isNotEmpty()) {
                        expandida = !expandida
                    },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Outlined.Science,
                    contentDescription = null,
                    tint = HeroGreen,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Compuestos en esta planta",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    when {
                        cargando -> Text(
                            "Cargando…",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        error != null -> Text(
                            "No se pudo cargar: $error",
                            style = MaterialTheme.typography.bodySmall,
                            color = AccentCoral
                        )
                        compuestos == null || compuestos.grupos.isEmpty() -> Text(
                            "Sin reportes de compuestos para esta planta",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        else -> Text(
                            "${compuestos.totalReportes} reporte(s) en esta ficha",
                            style = MaterialTheme.typography.bodySmall,
                            color = LeafBright
                        )
                    }
                }
                if (!cargando && error == null && compuestos != null && compuestos.grupos.isNotEmpty()) {
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = if (expandida) "Ocultar compuestos" else "Ver compuestos",
                        tint = Forest,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
            if (!cargando && error == null && compuestos != null && compuestos.grupos.isNotEmpty() && expandida) {
                Spacer(modifier = Modifier.height(14.dp))
                HorizontalDivider(color = Sage.copy(alpha = 0.45f))
                Spacer(modifier = Modifier.height(14.dp))
                val gruposVisibles = compuestos.grupos.limitarFicha(verTodos)
                gruposVisibles.forEachIndexed { indexGrupo, grupo ->
                    if (indexGrupo > 0) {
                        Spacer(modifier = Modifier.height(14.dp))
                    }
                    key(grupo.idCompuesto) {
                        BloqueGrupoCompuesto(
                            numeroGrupo = indexGrupo + 1,
                            grupo = grupo
                        )
                    }
                }
                BotonVerMasRegistros(
                    ocultos = compuestos.grupos.size - gruposVisibles.size,
                    mostrarTodos = verTodos,
                    onToggle = { verTodos = !verTodos }
                )
            }
        }
    }
}

@Composable
private fun BloqueGrupoCompuesto(
    numeroGrupo: Int,
    grupo: GrupoCompuestoEnPlanta
) {
    var fichaCatalogoAbierta by remember(grupo.idCompuesto) { mutableStateOf(false) }
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = CardWhite,
        border = BorderStroke(1.dp, Sage.copy(alpha = 0.55f))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Surface(
                    shape = CircleShape,
                    color = HeroGreen,
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            "$numeroGrupo",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        grupo.titulo,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    Text(
                        "Reportes en esta planta",
                        style = MaterialTheme.typography.labelSmall,
                        color = HeroGreen,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            grupo.reportes.forEachIndexed { indexReporte, registro ->
                if (indexReporte > 0) {
                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider(color = Sage.copy(alpha = 0.35f))
                    Spacer(modifier = Modifier.height(10.dp))
                }
                BloqueReporteEnPlanta(
                    numeroReporte = indexReporte + 1,
                    totalReportes = grupo.reportes.size,
                    vinculo = registro.vinculo
                )
            }
            grupo.catalogo?.takeIf { it.tieneFichaQuimica() }?.let { cat ->
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Sage.copy(alpha = 0.35f))
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    "Ficha química (catálogo)",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = EarthSoft,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { fichaCatalogoAbierta = !fichaCatalogoAbierta }
                        .padding(vertical = 2.dp)
                )
                if (fichaCatalogoAbierta) {
                    Spacer(modifier = Modifier.height(6.dp))
                    cat.tipo_compuesto?.trim()?.takeIf { it.isNotEmpty() }?.let { tipo ->
                        Text(
                            "Tipo: $tipo",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                    }
                    cat.formula_quimica?.trim()?.takeIf { it.isNotEmpty() }?.let { formula ->
                        Text(
                            "Fórmula: $formula",
                            style = MaterialTheme.typography.bodySmall,
                            fontStyle = FontStyle.Italic,
                            color = Forest,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                    cat.descripcion?.trim()?.takeIf { it.isNotEmpty() }?.let { desc ->
                        Text(
                            desc,
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                } else {
                    Text(
                        "Toca para ver tipo, fórmula y descripción del compuesto",
                        style = MaterialTheme.typography.bodySmall,
                        color = EarthSoft,
                        fontStyle = FontStyle.Italic,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun BloqueReporteEnPlanta(
    numeroReporte: Int,
    totalReportes: Int,
    vinculo: EspecieCompuesto
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        if (totalReportes > 1) {
            Text(
                "Reporte $numeroReporte",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                color = LeafBright
            )
            Spacer(modifier = Modifier.height(4.dp))
        }
        vinculo.parte_planta?.trim()?.takeIf { it.isNotEmpty() }?.let { parte ->
            Text(
                "Parte de la planta: $parte",
                style = MaterialTheme.typography.bodySmall,
                color = ForestDeep
            )
        }
        vinculo.concentracion_reportada?.trim()?.takeIf { it.isNotEmpty() }?.let { conc ->
            Text(
                "Concentración reportada: $conc",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        vinculo.observaciones?.trim()?.takeIf { it.isNotEmpty() }?.let { obs ->
            Text(
                obs,
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        val vacio = listOf(
            vinculo.parte_planta,
            vinculo.concentracion_reportada,
            vinculo.observaciones
        ).all { it.isNullOrBlank() }
        if (vacio) {
            Text(
                "Sin parte, concentración ni observaciones en este registro",
                style = MaterialTheme.typography.bodySmall,
                color = EarthSoft,
                fontStyle = FontStyle.Italic
            )
        }
    }
}

@Composable
private fun SeccionBibliografia(
    idEspecie: Int,
    bibliografia: BibliografiaPorEspecie?,
    cargando: Boolean,
    error: String? = null
) {
    val datos = bibliografia?.takeIf { it.idEspecie == idEspecie }
    var expandida by remember(idEspecie) { mutableStateOf(false) }
    var verTodos by remember(idEspecie) { mutableStateOf(false) }
    Spacer(modifier = Modifier.height(16.dp))
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Cream),
        border = BorderStroke(1.dp, SunGold.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = !cargando && error == null && datos != null && datos.obras.isNotEmpty()) {
                        expandida = !expandida
                    },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.AutoMirrored.Outlined.MenuBook,
                    contentDescription = null,
                    tint = SunAmber,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Obras consultadas",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    when {
                        cargando -> Text(
                            "Cargando…",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        error != null -> Text(
                            "No se pudo cargar: $error",
                            style = MaterialTheme.typography.bodySmall,
                            color = AccentCoral
                        )
                        datos == null || datos.obras.isEmpty() -> Text(
                            "Sin bibliografía para esta planta",
                            style = MaterialTheme.typography.bodySmall,
                            color = EarthSoft
                        )
                        else -> Text(
                            "${datos.totalObras} obra(s) · ${datos.totalCitas} mención(es) en esta ficha",
                            style = MaterialTheme.typography.bodySmall,
                            color = LeafBright
                        )
                    }
                }
                if (!cargando && error == null && datos != null && datos.obras.isNotEmpty()) {
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = if (expandida) "Ocultar bibliografía" else "Ver bibliografía",
                        tint = Forest,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
            if (!cargando && error == null && datos != null && datos.obras.isNotEmpty() && expandida) {
                Spacer(modifier = Modifier.height(14.dp))
                HorizontalDivider(color = Sage.copy(alpha = 0.45f))
                Spacer(modifier = Modifier.height(14.dp))
                val obrasVisibles = datos.obras.limitarFicha(verTodos)
                obrasVisibles.forEachIndexed { indexObra, obra ->
                    if (indexObra > 0) {
                        Spacer(modifier = Modifier.height(14.dp))
                    }
                    key(obra.fuente.id_fuente) {
                        BloqueObraBibliografica(
                            numeroObra = indexObra + 1,
                            obra = obra
                        )
                    }
                }
                BotonVerMasRegistros(
                    ocultos = datos.obras.size - obrasVisibles.size,
                    mostrarTodos = verTodos,
                    onToggle = { verTodos = !verTodos }
                )
            }
        }
    }
}

@Composable
private fun BloqueObraBibliografica(
    numeroObra: Int,
    obra: ObraBibliografica
) {
    val f = obra.fuente
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = CardWhite,
        border = BorderStroke(1.dp, Sage.copy(alpha = 0.55f))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Surface(
                    shape = CircleShape,
                    color = HeroGreen,
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            "$numeroObra",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        f.etiquetaPrincipal(),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = ForestDeep
                    )
                    val linea = f.lineaBibliografia()
                    if (linea.isNotEmpty()) {
                        Text(
                            linea,
                            style = MaterialTheme.typography.bodySmall,
                            color = Earth,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                    f.tipo_fuente?.trim()?.takeIf { it.isNotEmpty() }?.let { tipo ->
                        Text(
                            tipo,
                            style = MaterialTheme.typography.labelSmall,
                            color = EarthSoft,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            }
            if (obra.citas.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    if (obra.citas.size == 1) "Mención en esta planta" else "Menciones en esta planta",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = HeroGreen
                )
                Spacer(modifier = Modifier.height(8.dp))
                obra.citas.forEachIndexed { indexCita, cita ->
                    LineaCitaPlanta(
                        detalle = cita,
                        mostrarNumero = obra.citas.size > 1
                    )
                    if (indexCita < obra.citas.lastIndex) {
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun LineaCitaPlanta(
    detalle: DetalleFuenteEspecie,
    mostrarNumero: Boolean
) {
    Row(modifier = Modifier.fillMaxWidth()) {
        if (mostrarNumero) {
            Text(
                "•",
                style = MaterialTheme.typography.bodyMedium,
                color = SunAmber,
                modifier = Modifier.padding(end = 8.dp)
            )
        }
        Column {
            val resumen = buildList {
                detalle.tipo_aporte?.trim()?.takeIf { it.isNotEmpty() }?.let { add(it) }
                detalle.pagina_seccion?.trim()?.takeIf { it.isNotEmpty() }?.let { add(it) }
            }.joinToString(" · ")
            if (resumen.isNotEmpty()) {
                Text(
                    resumen,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = Earth
                )
            }
            detalle.cita_textual_resumida?.trim()?.takeIf { it.isNotEmpty() }?.let { cita ->
                Text(
                    cita,
                    style = MaterialTheme.typography.bodySmall,
                    color = EarthSoft,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
            detalle.nivel_confiabilidad?.trim()?.takeIf { it.isNotEmpty() }?.let { conf ->
                Text(
                    "Confiabilidad: $conf",
                    style = MaterialTheme.typography.labelSmall,
                    color = LeafBright,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}

@Composable
private fun BadgeInfo(etiqueta: String, valor: String) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = Cream,
        border = BorderStroke(1.dp, SunGold.copy(alpha = 0.4f))
    ) {
        Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
            Text(etiqueta, style = MaterialTheme.typography.labelSmall, color = EarthSoft)
            Text(
                valor,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = Forest,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun DetalleLinea(etiqueta: String, valor: String) {
    Column(modifier = Modifier.padding(bottom = 10.dp)) {
        Text(etiqueta, style = MaterialTheme.typography.labelSmall, color = EarthSoft)
        Text(valor, style = MaterialTheme.typography.bodyLarge, color = Earth, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun DetalleLineaOpcional(etiqueta: String, valor: String?) {
    val t = valor?.trim().orEmpty()
    if (t.isNotEmpty()) {
        Column(modifier = Modifier.padding(bottom = 10.dp)) {
            Text(etiqueta, style = MaterialTheme.typography.labelSmall, color = EarthSoft)
            Text(t, style = MaterialTheme.typography.bodyMedium, color = Earth)
        }
    }
}

@Composable
private fun BotonFavorito(
    esFavorito: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        modifier = modifier.size(44.dp),
        shape = CircleShape,
        color = Color.White.copy(alpha = 0.92f),
        shadowElevation = 4.dp
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = if (esFavorito) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                contentDescription = if (esFavorito) "Quitar de favoritos" else "Añadir a favoritos",
                tint = if (esFavorito) AccentCoral else ForestMuted,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

@Composable
private fun TarjetaPlanta(
    fila: FilaPlanta,
    esFavorito: Boolean,
    onToggleFavorito: () -> Unit,
    onClick: () -> Unit
) {
    val context = LocalContext.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(10.dp, RoundedCornerShape(22.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
            ) {
                val urlTarjeta = fila.urlImagen?.takeIf { it.isNotBlank() }
                key(fila.nombre.id_nombre_comun, urlTarjeta ?: "sin-foto") {
                    if (urlTarjeta != null) {
                        AsyncImage(
                            model = ImageRequest.Builder(context)
                                .data(urlTarjeta)
                                .crossfade(false)
                                .memoryCacheKey("lista-${fila.nombre.id_nombre_comun}-$urlTarjeta")
                                .diskCacheKey("lista-${fila.nombre.id_nombre_comun}-$urlTarjeta")
                                .build(),
                            contentDescription = fila.nombre.nombre_comun,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.linearGradient(
                                        colors = listOf(Mint, Sage.copy(alpha = 0.5f))
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Outlined.Eco,
                                contentDescription = null,
                                tint = HeroGreen,
                                modifier = Modifier.size(56.dp)
                            )
                        }
                    }
                }
                BotonFavorito(
                    esFavorito = esFavorito,
                    onClick = onToggleFavorito,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(12.dp)
                )
                Surface(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(12.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = SunGold
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Ver ficha",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = ForestDeep
                        )
                        Icon(
                            Icons.AutoMirrored.Filled.KeyboardArrowRight,
                            contentDescription = null,
                            tint = ForestDeep,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(5.dp)
                    .background(
                        Brush.horizontalGradient(listOf(HeroGreen, Sage, SunGold))
                    )
            )
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = fila.nombre.nombre_comun,
                    style = MaterialTheme.typography.titleLarge,
                    fontStyle = FontStyle.Italic,
                    fontWeight = FontWeight.Black,
                    color = ForestDeep,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MiniEtiqueta(fila.nombre.idioma)
                    MiniEtiqueta(fila.nombre.region_uso)
                }
            }
        }
    }
}

@Composable
private fun MiniEtiqueta(texto: String) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MintLight
    ) {
        Text(
            text = texto,
            style = MaterialTheme.typography.labelMedium,
            color = LeafBright,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun EstadoCentrado(texto: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                Icons.Outlined.Eco,
                contentDescription = null,
                tint = HeroGreen,
                modifier = Modifier.size(56.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = texto,
                style = MaterialTheme.typography.bodyLarge,
                color = Earth,
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun PantallaFavoritos(
    filasFavoritas: List<FilaPlanta>,
    favoritosIds: Set<Int>,
    onAbrirPlanta: (FilaPlanta) -> Unit,
    onAlternarFavorito: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Text(
            text = "Mis favoritos",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Black,
            color = ForestDeep,
            modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
        )
        Text(
            text = if (favoritosIds.isEmpty()) {
                "Toca el corazón en una planta para guardarla aquí."
            } else {
                "${filasFavoritas.size} planta(s) guardada(s)"
            },
            style = MaterialTheme.typography.bodyMedium,
            color = EarthSoft,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        if (filasFavoritas.isEmpty()) {
            EstadoFavoritosVacio(Modifier.weight(1f))
        } else {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentPadding = PaddingValues(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                items(filasFavoritas, key = { it.nombre.id_nombre_comun }) { fila ->
                    TarjetaPlanta(
                        fila = fila,
                        esFavorito = fila.nombre.id_nombre_comun in favoritosIds,
                        onToggleFavorito = { onAlternarFavorito(fila.nombre.id_nombre_comun) },
                        onClick = { onAbrirPlanta(fila) }
                    )
                }
            }
        }
    }
}

@Composable
private fun EstadoFavoritosVacio(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(listOf(AccentCoral.copy(alpha = 0.3f), MintLight))
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Filled.FavoriteBorder,
                    contentDescription = null,
                    tint = AccentCoral,
                    modifier = Modifier.size(40.dp)
                )
            }
            Spacer(modifier = Modifier.height(20.dp))
            Text(
                "Aún no tienes favoritos",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = ForestDeep
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "En Inicio o Catálogo, pulsa el corazón en cualquier planta.",
                style = MaterialTheme.typography.bodyMedium,
                color = EarthSoft,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 32.dp)
            )
        }
    }
}
