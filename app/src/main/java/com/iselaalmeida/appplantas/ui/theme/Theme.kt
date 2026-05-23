package com.iselaalmeida.appplantas.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = Sage,
    onPrimary = ForestDeep,
    primaryContainer = Forest,
    onPrimaryContainer = MintLight,
    secondary = SunGold,
    onSecondary = ForestDeep,
    background = ForestDeep,
    onBackground = MintLight,
    surface = Color(0xFF152A22),
    onSurface = MintLight,
    outline = Sage
)

private val FarmaciaLightScheme = lightColorScheme(
    primary = Forest,
    onPrimary = Color.White,
    primaryContainer = MintLight,
    onPrimaryContainer = ForestDeep,
    secondary = HeroGreen,
    onSecondary = Color.White,
    secondaryContainer = Mint,
    onSecondaryContainer = ForestDeep,
    tertiary = SunGold,
    onTertiary = ForestDeep,
    background = PageBackground,
    onBackground = Earth,
    surface = CardWhite,
    onSurface = Earth,
    surfaceVariant = MintLight,
    onSurfaceVariant = LeafBright,
    outline = Sage,
    outlineVariant = Mint
)

@Composable
fun AppPlantasTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> FarmaciaLightScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
