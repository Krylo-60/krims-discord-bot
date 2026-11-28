import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { isSecuritySuiteUnlocked, SECURITY_RELEASE_AT } from './antiNukeSecurityEngine.mjs';

const FOUNDER_ID = '1414143825538191373';
const FORMS_PATH = path.resolve(process.cwd(), 'data', 'app_forms.json');

// Map<guildId, Record<slug, { id, name, questions: string[], reviewChannelId: string, roleId: string | null }>>
const guildForms = new Map();

function loadForms() {
  try {
    if (fs.existsSync(FORMS_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(FORMS_PATH, 'utf8'));
      for (const [gid, forms] of Object.entries(parsed)) guildForms.set(gid, forms);
    }
  } catch (err) {
    console.warn('[AppForm] Failed to load forms:', err.message);
  }
}

function saveForms() {
  try {
    const dir = path.dirname(FORMS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FORMS_PATH, JSON.stringify(Object.fromEntries(guildForms), null, 2));
  } catch (err) {
    console.warn('[AppForm] Failed to save forms:', err.message);
  }
}

loadForms();

function slugify(name) {
  return String(name || 'form')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32) || 'staff_app';
}

function getFormsForGuild(guildId) {
  if (!guildForms.has(guildId)) guildForms.set(guildId, {});
  return guildForms.get(guildId);
}

function buildLockedReply() {
  const releaseUnix = Math.floor(SECURITY_RELEASE_AT / 1000);
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle('⏳ Custom Application Forms — Maintenance Timer Active')
        .setDescription(
          `Universal Application Forms (\`/appform\`) unlock automatically during the **Maintenance Release** <t:${releaseUnix}:R> (<t:${releaseUnix}:F>).`
        )
        .setTimestamp(),
    ],
    ephemeral: true,
  };
}

export async function handleAppFormCommand(interaction) {
  if (!interaction.guild) {
    return interaction.reply({ content: '❌ `/appform` can only be used inside a server.', ephemeral: true });
  }
  if (!isSecuritySuiteUnlocked() && interaction.user.id !== FOUNDER_ID) {
    return interaction.reply(buildLockedReply());
  }
  if (!interaction.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '❌ You need **Administrator** permission to manage `/appform`.', ephemeral: true });
  }

  const sub = interaction.options.getSubcommand(false) || 'list';
  const forms = getFormsForGuild(interaction.guild.id);

  if (sub === 'create') {
    const name = interaction.options.getString('name', true).trim();
    const rawQuestions = interaction.options.getString('questions', true);
    const reviewChannel = interaction.options.getChannel('review_channel', true);
    const role = interaction.options.getRole('role');

    const questions = rawQuestions
      .split('|')
      .map((q) => q.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (questions.length === 0) {
      return interaction.reply({ content: '❌ Provide at least 1 question (separate up to 5 questions with `|`).', ephemeral: true });
    }

    const id = slugify(name);
    forms[id] = {
      id,
      name,
      questions,
      reviewChannelId: reviewChannel.id,
      roleId: role ? role.id : null,
    };
    saveForms();

    return interaction.reply({
      content:
        `✅ **Application Form \`${name}\` Created!**\n` +
        `• Questions: \`${questions.length}\`\n` +
        `• Review Channel: <#${reviewChannel.id}>\n` +
        `• Accepted Role: ${role ? `<@&${role.id}>` : 'None'}\n\n` +
        `Run \`/appform panel form:${name}\` in your applications channel to post the Apply button!`,
      ephemeral: true,
    });
  }

  if (sub === 'panel') {
    const query = interaction.options.getString('form', true).trim();
    const form = forms[slugify(query)] || Object.values(forms).find((f) => f.name.toLowerCase() === query.toLowerCase());
    if (!form) {
      return interaction.reply({ content: `❌ Form \`${query}\` not found. Use \`/appform list\` to see existing forms.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00f2ff)
      .setTitle(`📝 Apply: ${form.name}`)
      .setDescription(
        `Interested in **${form.name}** for **${interaction.guild.name}**?\n` +
          `Click **Apply Now** below to answer ${form.questions.length} quick question(s).`
      )
      .setFooter({ text: 'Powered by Krims Code Applications' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`appform_apply:${interaction.guild.id}:${form.id}`)
        .setLabel('📝 Apply Now')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: `✅ Posted application panel for **${form.name}**!`, ephemeral: true });
  }

  if (sub === 'delete') {
    const query = interaction.options.getString('form', true).trim();
    const id = slugify(query);
    if (!forms[id]) {
      return interaction.reply({ content: `❌ Form \`${query}\` not found.`, ephemeral: true });
    }
    delete forms[id];
    saveForms();
    return interaction.reply({ content: `🗑️ Deleted application form \`${query}\`.`, ephemeral: true });
  }

  const list = Object.values(forms);
  if (list.length === 0) {
    return interaction.reply({ content: 'ℹ️ No custom application forms yet. Create one with `/appform create`!', ephemeral: true });
  }
  const summary = list
    .map((f) => `• **${f.name}** (\`${f.questions.length}\` Qs → <#${f.reviewChannelId}>${f.roleId ? ` • Role: <@&${f.roleId}>` : ''})`)
    .join('\n');
  return interaction.reply({ content: `📋 **Server Application Forms:**\n${summary}`, ephemeral: true });
}

export async function handleAppFormInteraction(interaction) {
  const cid = interaction.customId || '';
  if (!cid.startsWith('appform_')) return false;

  const parts = cid.split(':');
  const action = parts[0];
  const guildId = parts[1];
  const formId = parts[2];
  const applicantId = parts[3];

  const forms = getFormsForGuild(guildId);
  const form = forms[formId];

  if (interaction.isButton() && action === 'appform_apply') {
    if (!form) {
      await interaction.reply({ content: '❌ This application form is no longer active.', ephemeral: true });
      return true;
    }

    const modal = new ModalBuilder()
      .setCustomId(`appform_modal:${guildId}:${formId}`)
      .setTitle(form.name.slice(0, 45));

    form.questions.slice(0, 5).forEach((q, idx) => {
      const input = new TextInputBuilder()
        .setCustomId(`q_${idx}`)
        .setLabel(q.slice(0, 45))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
    });

    await interaction.showModal(modal);
    return true;
  }

  if (interaction.isModalSubmit() && action === 'appform_modal') {
    if (!form) {
      await interaction.reply({ content: '❌ This application form is no longer active.', ephemeral: true });
      return true;
    }

    const answers = form.questions.slice(0, 5).map((q, idx) => ({
      name: `${idx + 1}. ${q.slice(0, 200)}`,
      value: interaction.fields.getTextInputValue(`q_${idx}`).slice(0, 1000),
    }));

    const reviewChannel = await interaction.guild.channels.fetch(form.reviewChannelId).catch(() => null);
    if (reviewChannel?.isTextBased()) {
      const reviewEmbed = new EmbedBuilder()
        .setColor(0x00f2ff)
        .setTitle(`📩 New Application: ${form.name}`)
        .setDescription(`**Applicant:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)`)
        .addFields(answers)
        .setTimestamp();

      const decisionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`appform_accept:${guildId}:${formId}:${interaction.user.id}`)
          .setLabel('✅ Accept')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`appform_deny:${guildId}:${formId}:${interaction.user.id}`)
          .setLabel('❌ Deny')
          .setStyle(ButtonStyle.Danger)
      );

      await reviewChannel.send({ embeds: [reviewEmbed], components: [decisionRow] }).catch(() => {});
    }

    const voteRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🗳️ Vote for Krims on Top.gg')
        .setStyle(ButtonStyle.Link)
        .setURL('https://top.gg/bot/1523794466740371586/vote')
    );

    await interaction.reply({
      content: `✅ **Application submitted for ${form.name}!** Staff will review it shortly. While you wait, you can support Krims by voting:`,
      components: [voteRow],
      ephemeral: true,
    });
    return true;
  }

  if (interaction.isButton() && (action === 'appform_accept' || action === 'appform_deny')) {
    if (!interaction.member?.permissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: '❌ Only staff with **Manage Server** can accept or deny applications.', ephemeral: true });
      return true;
    }

    const accepted = action === 'appform_accept';
    const targetMember = await interaction.guild.members.fetch(applicantId).catch(() => null);

    if (accepted && form?.roleId && targetMember) {
      await targetMember.roles.add(form.roleId, `Accepted for ${form.name}`).catch(() => {});
    }

    if (targetMember) {
      await targetMember
        .send(
          accepted
            ? `🎉 **Congratulations!** Your application for **${form?.name || 'Staff'}** in **${interaction.guild.name}** was **Accepted**!`
            : `❌ Your application for **${form?.name || 'Staff'}** in **${interaction.guild.name}** was **Declined** this time.`
        )
        .catch(() => {});
    }

    const oldEmbed = interaction.message.embeds[0];
    const updatedEmbed = EmbedBuilder.from(oldEmbed)
      .setColor(accepted ? 0x10b981 : 0xef4444)
      .setFooter({
        text: `${accepted ? '✅ Accepted' : '❌ Declined'} by ${interaction.user.tag}`,
      });

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('appform_done_ok').setLabel('✅ Accept').setStyle(ButtonStyle.Success).setDisabled(true),
      new ButtonBuilder().setCustomId('appform_done_no').setLabel('❌ Deny').setStyle(ButtonStyle.Danger).setDisabled(true)
    );

    await interaction.update({ embeds: [updatedEmbed], components: [disabledRow] });
    return true;
  }

  return false;
}
